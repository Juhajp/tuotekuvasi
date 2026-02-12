'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, ImageIcon, Loader2, Sparkles, RefreshCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { startGeneration, getGenerationStatus } from '@/app/actions/generate';
import { Separator } from '@/components/ui/separator';
import { BackgroundShapes } from '@/components/background-shapes';
import { 
  loadClientConfig, 
  getEnvironments, 
  getGarmentTypes, 
  getModelGenders, 
  getModels,
  getBasePrompt,
  type ClientConfig,
  type DropdownOption
} from '@/lib/client-config';

// Rautio-kohtaiset asetukset (vain clientSlug === 'rautio')
type RautioItemCategory = 'tool' | 'workwear';

type RautioItem = {
  id: string;
  label: string;
  category: RautioItemCategory;
  /** Englanninkielinen termi promptia varten (työkalut) */
  promptLabel?: string;
};

const RAUTIO_ITEMS: RautioItem[] = [
  // Työkalut
  {
    id: 'cordless-drill',
    label: 'Akkuporakone',
    category: 'tool',
    promptLabel: 'cordless drill, short drill bit',
  },
  {
    id: 'angle-grinder',
    label: 'Kulmahiomakone',
    category: 'tool',
    promptLabel: 'angle grinder',
  },
  {
    id: 'circular-saw',
    label: 'Käsisirkkeli',
    category: 'tool',
    promptLabel: 'circular saw',
  },
  {
    id: 'nut-runner',
    label: 'Mutterinväännin',
    category: 'tool',
    promptLabel: 'nut runner',
  },
  // Työvaatteet
  {
    id: 'jacket',
    label: 'Työtakki',
    category: 'workwear',
    promptLabel: 'work jacket',
  },
  {
    id: 'pants',
    label: 'Työhousut',
    category: 'workwear',
    promptLabel: 'work pants',
  },
  {
    id: 'shoes',
    label: 'Turvakengät',
    category: 'workwear',
    promptLabel: 'safety shoes (closeup photo of feet)',
  },
];

const RAUTIO_TOOL_BASE_PROMPT =
  'High-energy commercial lifestyle photography of a person using this specific {tool_name}. ' +
  'The image must convey power, efficiency, and reliability.\n\n' +
  'CRITICAL CONSTRAINTS:\n' +
  '- Identity Preservation: The tool in the user\'s hand must match the input image exactly (color, branding, form factor, every detail).\n' +
  '- Safety First: The operator MUST wear appropriate Personal Protective Equipment (PPE) relevant to the tool (e.g., safety glasses, gloves, ear defenders, helmet for forestry).\n' +
  '- Action: The tool must be in active use, not just held. Create interaction with the environment.\n' +
  '- Grip: Hands must hold the tool correctly and firmly by the designated handles.';

const RAUTIO_WORKWEAR_BASE_PROMPT =
  'Commercial industrial workwear photography. A professional tradesperson wearing this specific {item_category}. ' +
  'The image highlights durability, functionality, and safety standards.\n\n' +
  'Lighting: High-contrast commercial lighting that emphasizes the texture of rugged materials (canvas, Gore-Tex, reinforced seams).\n' +
  'Style: Authentic, capable, and heavy-duty. Not a fashion pose.\n\n' +
  'CRITICAL – preserve every garment detail from the source image:\n' +
  '- Identity: The garment must match the input image exactly—same cut, fit, length, and proportions.\n' +
  '- Colors and materials: Preserve exact fabric colors, color blocks, and material appearance (e.g. mesh, canvas, softshell).\n' +
  '- Branding: Keep all logos, labels, text, and reflective strips in the same positions, sizes, and colors.\n' +
  '- Construction: Match pocket placement and style, zippers, buttons, seams, stitching, and any visible technical details.\n' +
  '- Do not add reflective strips, logos, patches, or stripes to any garment that does not show them in the source image. Only the garment(s) visible in the input may have these details; replicate their exact number and placement.';

/** Rautio-kohtaiset ympäristöt: suomenkielinen label UI:hin, setting englanniksi promptiin */
const RAUTIO_ENVIRONMENTS: DropdownOption[] = [
  {
    id: 'yard-winter',
    label: 'Suomalainen piha talvella',
    setting:
      'The setting is a Finnish yard in winter: snow on the ground, cold season. Natural winter daylight, crisp atmosphere. The environment feels authentic and Nordic.',
  },
  {
    id: 'yard-summer',
    label: 'Suomalainen piha kesällä',
    setting:
      'The setting is a Finnish yard in summer: green lawn, typical Nordic summer. Natural daylight, warm and bright. The environment feels authentic and Nordic.',
  },
  {
    id: 'renovation-indoor',
    label: 'Remontoitava talo sisällä',
    setting:
      'The setting is the interior of a house under renovation: unfinished walls, construction context, tools or materials visible. Interior lighting, authentic renovation site atmosphere.',
  },
];

/** Rautio: 35-vuotias malli, Nainen/Mies ennallaan */
const RAUTIO_MODEL_GENDERS: DropdownOption[] = [
  {
    id: 'female',
    label: 'Nainen',
    description:
      'female, approx 35 years old, scandinavian ethnicity, blonde hair, natural makeup',
  },
  {
    id: 'male',
    label: 'Mies',
    description:
      'male, approx 35 years old, scandinavian ethnicity, short hair, clean-shaven',
  },
];

/** Rautio: vain Gemini (GPT Image 1.5 Edit pois käytöstä) */
const RAUTIO_MODELS: DropdownOption[] = [
  { id: 'gemini-25-flash-image/edit', label: 'Gemini 2.5 Flash Edit' },
];

export default function ClientPage() {
  const params = useParams();
  const clientSlug = params.slug as string;

  // Client config state
  const [clientConfig, setClientConfig] = useState<ClientConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Dynamic options based on client config
  const [environments, setEnvironments] = useState<DropdownOption[]>([]);
  const [garmentTypes, setGarmentTypes] = useState<DropdownOption[]>([]);
  const [modelGenders, setModelGenders] = useState<DropdownOption[]>([]);
  const [models, setModels] = useState<DropdownOption[]>([]);

  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [garmentType, setGarmentType] = useState<string>('');
  const [modelGender, setModelGender] = useState<string>('');
  const [environment, setEnvironment] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [result, setResult] = useState<{ original: string, generated: string } | null>(null);

  // Rautio-kohtainen valinta (vain kun clientSlug === 'rautio')
  const [rautioItemId, setRautioItemId] = useState<string>(RAUTIO_ITEMS[0]?.id ?? '');

  // Pidä rautioItemId synkassa valitun kategorian kanssa (esim. vanha id)
  useEffect(() => {
    if (clientSlug !== 'rautio') return;
    const current = RAUTIO_ITEMS.find((i) => i.id === rautioItemId);
    const category = current?.category ?? 'tool';
    const inCategory = RAUTIO_ITEMS.some(
      (i) => i.category === category && i.id === rautioItemId
    );
    if (!inCategory) {
      const first = RAUTIO_ITEMS.find((i) => i.category === category);
      if (first) {
        setRautioItemId(first.id);
        setGarmentType(first.id);
      }
    }
  }, [clientSlug, rautioItemId]);

  // Load client configuration on mount
  useEffect(() => {
    async function loadConfig() {
      setIsLoadingConfig(true);
      const config = await loadClientConfig(clientSlug);
      
      if (!config) {
        toast.error(`Asiakasta "${clientSlug}" ei löytynyt.`);
        setIsLoadingConfig(false);
        return;
      }

      setClientConfig(config);

      // Load dynamic dropdown options
      const envs =
        clientSlug === 'rautio' ? RAUTIO_ENVIRONMENTS : getEnvironments(config);
      const garments =
        clientSlug === 'rautio'
          ? (RAUTIO_ITEMS as unknown as DropdownOption[])
          : getGarmentTypes(config);
      const genders =
        clientSlug === 'rautio' ? RAUTIO_MODEL_GENDERS : getModelGenders(config);
      const aiModels =
        clientSlug === 'rautio' ? RAUTIO_MODELS : getModels(config);

      setEnvironments(envs);
      setGarmentTypes(garments);
      setModelGenders(genders);
      setModels(aiModels);

      // Set default values
      setEnvironment(config.default_environment || envs[0]?.id || '');
      setGarmentType(config.default_garment_type || garments[0]?.id || '');
      setModelGender(config.default_model_gender || genders[0]?.id || '');
      setModel(config.default_model || aiModels[0]?.id || '');

      setIsLoadingConfig(false);
    }

    loadConfig();
  }, [clientSlug]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleGenerate = async () => {
    if (!file) {
      toast.error("Valitse ensin kuva.");
      return;
    }

    if (!clientConfig) {
      toast.error("Asiakasasetuksia ei ladattu.");
      return;
    }

    setIsGenerating(true);
    const selectedEnvironment = environments.find(e => e.id === environment);
    const selectedGarment = garmentTypes.find(g => g.id === garmentType);
    const selectedGender = modelGenders.find(mg => mg.id === modelGender);

    let fullPrompt: string;

    if (clientSlug === 'rautio') {
      const rautioItem = RAUTIO_ITEMS.find((item) => item.id === rautioItemId) ?? RAUTIO_ITEMS[0];
      const isTool = rautioItem.category === 'tool';

      const basePrompt = isTool
        ? RAUTIO_TOOL_BASE_PROMPT.replace(
            '{tool_name}',
            rautioItem.promptLabel ?? rautioItem.label
          )
        : RAUTIO_WORKWEAR_BASE_PROMPT.replace(
            '{item_category}',
            rautioItem.promptLabel ?? rautioItem.label
          );

      const modelPart = selectedGender?.description
        ? `MODEL:\n${selectedGender.description}`
        : '';

      const settingPart = selectedEnvironment?.setting
        ? `SETTING:\n${selectedEnvironment.setting}`
        : '';

      fullPrompt = [basePrompt, modelPart, settingPart].filter(Boolean).join('\n\n');
    } else {
      // Use client's base prompt (oletuslogiikka muille asiakkaille)
      const basePrompt = getBasePrompt(clientConfig);
      const garmentDescription = selectedGarment?.label || 'garment';
      const modelDescription = selectedGender?.description || 'professional model';
      
      const fullBasePrompt = basePrompt
        .replace(/this garment/gi, `this ${garmentDescription}`)
        .replace(/fashion model/gi, modelDescription);
      
      const settingPart = selectedEnvironment?.setting 
        ? `SETTING:\n${selectedEnvironment.setting}` 
        : '';
      
      const importantPart = `IMPORTANT INSTRUCTIONS:
1. Map the exact garment from the input image onto the model's body with PERFECT anatomical accuracy
2. Preserve ALL original details exactly as shown in the input
3. The fabric must drape naturally following the body's curves and gravity
4. Maintain the exact texture, pattern, and material appearance from the original garment
${selectedGarment?.promptHints ? `5. SPECIFIC DETAIL: ${selectedGarment.promptHints}` : ''}`;
      
      fullPrompt = `${fullBasePrompt}\n\n${settingPart}\n\n${importantPart}`;
    }
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('backgroundPrompt', fullPrompt);
    formData.append('model', model);
    formData.append('clientId', clientConfig.id); // Pass client ID for tracking

    try {
      const response = await startGeneration(formData);
      
      if (response.success && response.generationId) {
        setGenerationId(response.generationId);
        toast.success("Generointi aloitettu! Odota hetki...");
      } else {
        toast.error(response.error || "Generoinnin aloitus epäonnistui.");
        setIsGenerating(false);
      }
    } catch (error) {
      toast.error("Odottamaton virhe tapahtui.");
      console.error(error);
      setIsGenerating(false);
    }
  };

  // Poll generation status
  useEffect(() => {
    if (!generationId || !isGenerating) return;

    const pollInterval = setInterval(async () => {
      const statusResponse = await getGenerationStatus(generationId);
      
      if (statusResponse.success && statusResponse.data) {
        const { status, generated_image_url, original_image_url, error_message } = statusResponse.data;
        
        if (status === 'completed' && generated_image_url) {
          setResult({
            original: original_image_url,
            generated: generated_image_url
          });
          toast.success("Kuva generoitu onnistuneesti!");
          setIsGenerating(false);
          setGenerationId(null);
          clearInterval(pollInterval);
          // Refresh client config to update credits display
          loadClientConfig(clientSlug).then((fresh) => {
            if (fresh) setClientConfig(fresh);
          });
        } else if (status === 'failed') {
          toast.error(`Generointi epäonnistui: ${error_message || 'Tuntematon virhe'}`);
          setIsGenerating(false);
          setGenerationId(null);
          clearInterval(pollInterval);
        }
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [generationId, isGenerating]);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setGenerationId(null);
    setIsGenerating(false);
  };

  const handleDownload = async () => {
    if (!result?.generated) return;
    
    try {
      const response = await fetch(result.generated);
      const blob = await response.blob();
      
      // Convert to JPG if needed
      const img = new Image();
      const imgUrl = URL.createObjectURL(blob);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imgUrl;
      });
      
      // Create canvas and convert to JPG
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      // Fill white background (JPG doesn't support transparency)
      ctx!.fillStyle = '#FFFFFF';
      ctx!.fillRect(0, 0, canvas.width, canvas.height);
      ctx!.drawImage(img, 0, 0);
      
      // Convert to JPG blob
      canvas.toBlob((jpgBlob) => {
        if (!jpgBlob) return;
        
        const url = URL.createObjectURL(jpgBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tuotekuva-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        URL.revokeObjectURL(imgUrl);
        document.body.removeChild(a);
      }, 'image/jpeg', 0.95); // 95% quality
      
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Lataus epäonnistui');
    }
  };

  if (isLoadingConfig) {
    return (
      <main className="min-h-screen py-12 px-4 flex items-center justify-center relative">
        <BackgroundShapes />
        <Loader2 className="w-10 h-10 animate-spin text-[#fcbf49] relative z-0" />
      </main>
    );
  }

  if (!clientConfig) {
    return (
      <main className="min-h-screen py-12 px-4 flex items-center justify-center relative">
        <BackgroundShapes />
        <Card className="bg-white/95 border border-white/20 rounded-2xl shadow-xl relative z-0">
          <CardHeader>
            <CardTitle className="text-[#003049]">Asiakasta ei löytynyt</CardTitle>
            <CardDescription className="text-slate-600">Tarkista URL ja yritä uudelleen.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative">
      <BackgroundShapes />
      <div className="max-w-4xl mx-auto space-y-8 relative z-0">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            {clientConfig.name}
          </h1>
          <p className="text-lg max-w-2xl mx-auto text-white/80">
            Luo ammattitasoisia tuotekuvia tekoälyn avulla.
          </p>
          {typeof (clientConfig as { credits_balance?: number }).credits_balance === 'number' && (
            <p className="text-sm font-medium text-white/70">
              Krediittejä jäljellä: <span className="text-[#fcbf49] font-semibold">{(clientConfig as { credits_balance?: number }).credits_balance}</span>
              <span className="text-white/60 ml-1">(1 krediitti = 1 generointi)</span>
            </p>
          )}
        </div>

        {!result ? (
          <Card className="border border-white/20 shadow-2xl bg-white/95 backdrop-blur overflow-hidden rounded-2xl">
            <CardHeader className="border-b border-white/10 bg-transparent py-6 px-6">
              <CardTitle className="flex items-center gap-2 text-[#003049] font-semibold">
                <ImageIcon className="w-5 h-5 text-[#003049]" />
                Uusi generointi
              </CardTitle>
              <CardDescription className="text-slate-600 mt-1">
                Lataa selkeä kuva tuotteesta tasaisella taustalla
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Dropzone */}
              <div 
                {...getRootProps()} 
                className={`
                  relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer min-h-[300px]
                  flex flex-col items-center justify-center
                  ${isDragActive ? 'border-[#fcbf49] bg-[#fcbf49]/10' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}
                  ${preview ? 'p-2' : 'p-8'}
                `}
              >
                <input {...getInputProps()} />
                
                {preview ? (
                  <div className="relative w-full h-full min-h-[300px] flex items-center justify-center">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="max-h-[400px] rounded-lg shadow-md object-contain"
                    />
                    {isGenerating && (
                      <div className="absolute inset-0 bg-[#003049]/80 rounded-lg flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                        <Loader2 className="w-12 h-12 text-[#fcbf49] animate-spin" />
                        <p className="text-white font-medium">Generoidaan kuvaa...</p>
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#fcbf49] animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-[#fcbf49] animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-[#fcbf49] animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                    {!isGenerating && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <p className="text-white font-medium flex items-center gap-2">
                          <Upload className="w-5 h-5" /> Vaihda kuva
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="bg-white/80 p-4 rounded-full shadow-sm inline-block">
                      <Upload className="w-8 h-8 text-[#003049]" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-slate-700">
                        Pudota kuva tähän tai klikkaa valitaksesi
                      </p>
                      <p className="text-sm text-slate-500">
                        PNG tai JPG (max. 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="space-y-4">
                {clientSlug === 'rautio' ? (
                  <>
                    {/* Rautio: Työkalu / työvaate -rakenne */}
                    {(() => {
                      const rautioCategory =
                        (RAUTIO_ITEMS.find((i) => i.id === rautioItemId)?.category ??
                          'tool') as RautioItemCategory;
                      const itemsInCategory = RAUTIO_ITEMS.filter(
                        (item) => item.category === rautioCategory
                      );
                      const currentItemInCategory = itemsInCategory.some(
                        (i) => i.id === rautioItemId
                      );
                      const effectiveItemId = currentItemInCategory
                        ? rautioItemId
                        : itemsInCategory[0]?.id ?? rautioItemId;
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Kategoria</label>
                            <Select
                              value={rautioCategory}
                              onValueChange={(val: RautioItemCategory) => {
                                const firstInCategory =
                                  RAUTIO_ITEMS.find((i) => i.category === val) ?? RAUTIO_ITEMS[0];
                                setGarmentType(firstInCategory.id);
                                setRautioItemId(firstInCategory.id);
                              }}
                            >
                              <SelectTrigger className="w-full h-12">
                                <SelectValue placeholder="Valitse kategoria" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tool">Työkalu</SelectItem>
                                <SelectItem value="workwear">Työvaate</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">
                              {rautioCategory === 'tool' ? 'Työkalu' : 'Työvaate'}
                            </label>
                            <Select
                              value={effectiveItemId}
                              onValueChange={(val: string) => {
                                setRautioItemId(val);
                                setGarmentType(val);
                              }}
                            >
                              <SelectTrigger className="w-full h-12">
                                <SelectValue
                                  placeholder={
                                    rautioCategory === 'tool'
                                      ? 'Valitse työkalu'
                                      : 'Valitse työvaate'
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {itemsInCategory.map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {environments.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">Ympäristö</label>
                          <Select value={environment} onValueChange={setEnvironment}>
                            <SelectTrigger className="w-full h-12">
                              <SelectValue placeholder="Valitse ympäristö" />
                            </SelectTrigger>
                            <SelectContent>
                              {environments.map((e) => (
                                <SelectItem key={e.id} value={e.id}>
                                  {e.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {modelGenders.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">
                            Mallin sukupuoli
                          </label>
                          <Select value={modelGender} onValueChange={setModelGender}>
                            <SelectTrigger className="w-full h-12">
                              <SelectValue placeholder="Valitse sukupuoli" />
                            </SelectTrigger>
                            <SelectContent>
                              {modelGenders.map((mg) => (
                                <SelectItem key={mg.id} value={mg.id}>
                                  {mg.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {models.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">AI-malli</label>
                          <Select value={model} onValueChange={setModel}>
                            <SelectTrigger className="w-full h-12">
                              <SelectValue placeholder="Valitse malli" />
                            </SelectTrigger>
                            <SelectContent>
                              {models.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {garmentTypes.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">
                            Vaatetyyppi
                          </label>
                          <Select value={garmentType} onValueChange={setGarmentType}>
                            <SelectTrigger className="w-full h-12">
                              <SelectValue placeholder="Valitse vaate" />
                            </SelectTrigger>
                            <SelectContent>
                              {garmentTypes.map((g) => (
                                <SelectItem key={g.id} value={g.id}>
                                  {g.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {modelGenders.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">
                            Mallin sukupuoli
                          </label>
                          <Select value={modelGender} onValueChange={setModelGender}>
                            <SelectTrigger className="w-full h-12">
                              <SelectValue placeholder="Valitse sukupuoli" />
                            </SelectTrigger>
                            <SelectContent>
                              {modelGenders.map((mg) => (
                                <SelectItem key={mg.id} value={mg.id}>
                                  {mg.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {environments.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">Ympäristö</label>
                          <Select value={environment} onValueChange={setEnvironment}>
                            <SelectTrigger className="w-full h-12">
                              <SelectValue placeholder="Valitse ympäristö" />
                            </SelectTrigger>
                            <SelectContent>
                              {environments.map((e) => (
                                <SelectItem key={e.id} value={e.id}>
                                  {e.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {models.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">AI-malli</label>
                          <Select value={model} onValueChange={setModel}>
                            <SelectTrigger className="w-full h-12">
                              <SelectValue placeholder="Valitse malli" />
                            </SelectTrigger>
                            <SelectContent>
                              {models.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                {typeof (clientConfig as { credits_balance?: number }).credits_balance === 'number' && (clientConfig as { credits_balance: number }).credits_balance <= 0 && (
                  <p className="text-amber-600 text-sm font-medium text-center">
                    Ei krediittejä jäljellä. Ota yhteyttä palvelun ylläpitäjään.
                  </p>
                )}
                <Button 
                  size="lg" 
                  className="w-full h-12 text-lg font-bold btn-generate text-white transition-all rounded-xl border-0"
                  onClick={handleGenerate}
                  disabled={!file || isGenerating || (typeof (clientConfig as { credits_balance?: number }).credits_balance === 'number' && (clientConfig as { credits_balance: number }).credits_balance < 1)}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generoidaan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Luo uusi kuva
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Result View */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="overflow-hidden border border-white/20 bg-white/95 rounded-2xl shadow-xl">
                <CardHeader className="border-b border-slate-200 bg-transparent py-4 px-5">
                  <CardTitle className="text-sm font-semibold text-[#003049] uppercase tracking-widest">
                    Alkuperäinen
                  </CardTitle>
                </CardHeader>
                <div className="aspect-square bg-white flex items-center justify-center p-4">
                  <img src={result.original} alt="Alkuperäinen" className="max-w-full max-h-full object-contain rounded-lg" />
                </div>
              </Card>

              <Card className="overflow-hidden border-0 bg-white/95 rounded-2xl shadow-2xl">
                <CardHeader className="bg-transparent py-4 px-5 border-b border-slate-200">
                  <CardTitle className="text-sm font-semibold text-[#003049] uppercase tracking-widest">
                    AI-generoitu
                  </CardTitle>
                </CardHeader>
                <div className="aspect-square bg-white flex items-center justify-center p-4">
                  <img src={result.generated} alt="Generoitu" className="max-w-full max-h-full object-contain rounded-lg" />
                </div>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={reset}
                className="h-12 px-8 bg-transparent border-2 border-white text-white hover:bg-white/15 rounded-xl font-semibold shadow-lg min-w-[180px]"
              >
                <RefreshCcw className="mr-2 h-5 w-5" /> Aloita alusta
              </Button>
              <Button 
                size="lg" 
                className="h-12 px-8 btn-generate text-white font-bold rounded-xl min-w-[180px] border-0"
                onClick={handleDownload}
              >
                Lataa kuva
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
       
        <footer className="text-center text-white/60 text-sm pb-12">
          &copy; 2026 tuotekuvasi.fi
        </footer>
      </div>
    </main>
  );
}
