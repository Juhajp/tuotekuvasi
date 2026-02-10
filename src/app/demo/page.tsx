'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ImageIcon, Loader2, Sparkles, RefreshCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { startGeneration, getGenerationStatus } from './actions/generate';
import { Separator } from '@/components/ui/separator';

const GARMENT_TYPES = [
  { id: 't-shirt', label: 'T-paita', bodyPart: 'torso', promptHints: 'Ensure the neckline shape, sleeve length, and hem length match exactly. Pay attention to any graphics or text on the shirt.' },
  { id: 'shirt', label: 'Paita', bodyPart: 'torso', promptHints: 'Ensure collar shape, button placket alignment, cuff details, and pocket positioning match the original exactly.' },
  { id: 'blouse', label: 'Pusero', bodyPart: 'torso', promptHints: 'Pay special attention to the neckline style, sleeve design, and any ruffles or decorative elements.' },
  { id: 'sweater', label: 'Neule / Villapaita', bodyPart: 'torso', promptHints: 'Preserve the knit pattern texture, ribbing details at cuffs and hem, and the exact neckline style.' },
  { id: 'hoodie', label: 'Huppari', bodyPart: 'torso', promptHints: 'Ensure the hood drapes naturally, drawstrings are visible, and any front pocket or zipper details are accurate.' },
  { id: 'jacket', label: 'Takki', bodyPart: 'torso', promptHints: 'Match the collar type, zipper/button closure, pocket placement, and overall length precisely.' },
  { id: 'coat', label: 'Pitkä takki / Turkki', bodyPart: 'torso', promptHints: 'Preserve the coat length, lapel style, button arrangement, and any belt or tie details accurately.' },
  { id: 'dress', label: 'Mekko', bodyPart: 'full', promptHints: 'Pay special attention to the neckline depth and style, waistline position, sleeve type, and hem length. Preserve any patterns or decorative elements.' },
  { id: 'skirt', label: 'Hame', bodyPart: 'lower', promptHints: 'Ensure the waistline sits correctly, hem length is accurate, and any pleats or patterns are preserved.' },
  { id: 'pants', label: 'Housut', bodyPart: 'lower', promptHints: 'Match the fit (slim, regular, wide), leg length, and any pockets or details at the waist and ankles.' },
  { id: 'jeans', label: 'Farkut', bodyPart: 'lower', promptHints: 'Preserve denim texture, stitching details, distressing or fading patterns, and pocket styling exactly.' },
  { id: 'shorts', label: 'Shortsit', bodyPart: 'lower', promptHints: 'Ensure the leg length and fit match exactly, along with any pockets or hem details.' },
  { id: 'beanie', label: 'Pipo', bodyPart: 'head', promptHints: 'Match the knit texture, fit on the head, and any fold or cuff details.' },
  { id: 'hat', label: 'Hattu', bodyPart: 'head', promptHints: 'Preserve the brim width, crown height, and any decorative bands or logos.' },
  { id: 'scarf', label: 'Huivi / Kaulaliina', bodyPart: 'neck', promptHints: 'Ensure the draping style, pattern, fringe details, and fabric texture are accurate.' },
  { id: 'socks', label: 'Sukat', bodyPart: 'feet', promptHints: 'Match the height (ankle, crew, knee), ribbing pattern, and any designs or logos.' },
  { id: 'shoes', label: 'Kengät', bodyPart: 'feet', promptHints: 'Preserve shoe type (sneakers, boots, heels), lacing details, sole design, and any logos or patterns.' },
];

const ENVIRONMENTS = [
  { 
    id: 'studio', 
    label: 'Professional Studio', 
    setting: 'The setting is a clean, professional photo studio background, light grey color. The lighting is soft, diffused daylight coming from the side.' 
  },
  { 
    id: 'winter', 
    label: 'Finnish Winter Landscape', 
    setting: 'The setting is a beautiful Finnish winter landscape with snow-covered pine trees in the background. The lighting is natural, soft winter daylight creating a crisp, fresh atmosphere.' 
  },
];

const MODEL_GENDERS = [
  { 
    id: 'female', 
    label: 'Nainen',
    description: 'female, approx 25 years old, scandinavian ethnicity, blonde hair, natural makeup'
  },
  { 
    id: 'male', 
    label: 'Mies',
    description: 'male, approx 25 years old, scandinavian ethnicity, short hair, clean-shaven'
  },
];

const MODELS = [
  { id: 'gpt-image-1.5/edit', label: 'GPT Image 1.5 Edit' },
  { id: 'gemini-25-flash-image/edit', label: 'Gemini 2.5 Flash Edit' },
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [garmentType, setGarmentType] = useState<string>(GARMENT_TYPES[0].id);
  const [modelGender, setModelGender] = useState<string>(MODEL_GENDERS[0].id);
  const [environment, setEnvironment] = useState<string>(ENVIRONMENTS[0].id);
  const [model, setModel] = useState<string>(MODELS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [result, setResult] = useState<{ original: string, generated: string } | null>(null);

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

    setIsGenerating(true);
    const selectedEnvironment = ENVIRONMENTS.find(e => e.id === environment);
    const selectedGarment = GARMENT_TYPES.find(g => g.id === garmentType);
    const selectedGender = MODEL_GENDERS.find(mg => mg.id === modelGender);
    
    // Rakenna täydellinen prompt vaatetyypillä ja sukupuolella
    const basePrompt = `Visualize this ${selectedGarment?.label || 'piece of clothing'} being worn by a professional fashion model, ${selectedGender?.description || 'approx 25 years old'}, standing in a relaxed pose.`;
    const settingPart = `SETTING:\n${selectedEnvironment?.setting || ''}`;
    
    // Parannettu IMPORTANT-osio konkreettisilla säännöillä
    const importantPart = `IMPORTANT INSTRUCTIONS:
1. Map the exact garment from the input image onto the model's body with PERFECT anatomical accuracy
2. Preserve ALL original details: collar shape, neckline depth, sleeve length, hem length, buttons, zippers, pockets, and seams exactly as shown in the input
3. The fabric must drape naturally following the body's curves and gravity
4. Wrinkles and folds should appear only where the fabric naturally bends (elbows, waist, knees)
5. Maintain the exact texture, pattern, and material appearance from the original garment
6. The garment should fit the model's body size appropriately - not too tight, not too loose
${selectedGarment?.promptHints ? `7. SPECIFIC DETAIL: ${selectedGarment.promptHints}` : ''}`;
    
    const fullPrompt = `${basePrompt}\n\n${settingPart}\n\n${importantPart}`;
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('backgroundPrompt', fullPrompt);
    formData.append('model', model);

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
        } else if (status === 'failed') {
          toast.error(`Generointi epäonnistui: ${error_message || 'Tuntematon virhe'}`);
          setIsGenerating(false);
          setGenerationId(null);
          clearInterval(pollInterval);
        }
        // If status is 'pending' or 'processing', keep polling
      }
    }, 3000); // Poll every 3 seconds

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

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            tuotekuvasi.fi
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Luo ammattitasoisia vaatekuvia mallin päällä sekunneissa tekoälyn avulla. 
            Lataa kuva vaatteesta, valitse ympäristö ja anna AI:n hoitaa loput.
          </p>
        </div>

        {!result ? (
          <Card className="border-2 shadow-xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-900 text-white">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Uusi generointi
              </CardTitle>
              <CardDescription className="text-slate-300">
                Lataa kuva vaatteesta (paita, takki, mekko jne.) tasaisella taustalla
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Dropzone */}
              <div 
                {...getRootProps()} 
                className={`
                  relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer
                  flex flex-col items-center justify-center min-h-[300px]
                  ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}
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
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <p className="text-white font-medium flex items-center gap-2">
                        <Upload className="w-5 h-5" /> Vaihda kuva
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="bg-white p-4 rounded-full shadow-sm inline-block">
                      <Upload className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-slate-700">
                        Pudota kuva tähän tai klikkaa valitaksesi
                      </p>
                      <p className="text-sm text-slate-500">
                        PNG, JPG tai WEBP (max. 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Vaatetyyppi</label>
                    <Select value={garmentType} onValueChange={setGarmentType}>
                      <SelectTrigger className="w-full h-12">
                        <SelectValue placeholder="Valitse vaate" />
                      </SelectTrigger>
                      <SelectContent>
                        {GARMENT_TYPES.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Mallin sukupuoli</label>
                    <Select value={modelGender} onValueChange={setModelGender}>
                      <SelectTrigger className="w-full h-12">
                        <SelectValue placeholder="Valitse sukupuoli" />
                      </SelectTrigger>
                      <SelectContent>
                        {MODEL_GENDERS.map((mg) => (
                          <SelectItem key={mg.id} value={mg.id}>
                            {mg.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Ympäristö</label>
                    <Select value={environment} onValueChange={setEnvironment}>
                      <SelectTrigger className="w-full h-12">
                        <SelectValue placeholder="Valitse ympäristö" />
                      </SelectTrigger>
                      <SelectContent>
                        {ENVIRONMENTS.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">AI-malli</label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger className="w-full h-12">
                        <SelectValue placeholder="Valitse malli" />
                      </SelectTrigger>
                      <SelectContent>
                        {MODELS.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                  onClick={handleGenerate}
                  disabled={!file || isGenerating}
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
              <Card className="overflow-hidden border-2">
                <CardHeader className="bg-slate-100 py-3">
                  <CardTitle className="text-sm font-medium text-slate-500 uppercase">Alkuperäinen</CardTitle>
                </CardHeader>
                <div className="aspect-square bg-white flex items-center justify-center p-4">
                  <img src={result.original} alt="Alkuperäinen" className="max-w-full max-h-full object-contain" />
                </div>
              </Card>

              <Card className="overflow-hidden border-2 border-blue-500 shadow-2xl shadow-blue-100">
                <CardHeader className="bg-blue-500 py-3">
                  <CardTitle className="text-sm font-medium text-white uppercase">AI-generoitu</CardTitle>
                </CardHeader>
                <div className="aspect-square bg-white flex items-center justify-center p-4">
                  <img src={result.generated} alt="Generoitu" className="max-w-full max-h-full object-contain" />
                </div>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={reset}
                className="h-12 px-8"
              >
                <RefreshCcw className="mr-2 h-4 w-4" /> Aloita alusta
              </Button>
              <Button 
                size="lg" 
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700"
                onClick={handleDownload}
              >
                Lataa kuva
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <Separator className="my-12" />
        <footer className="text-center text-slate-400 text-sm pb-12">
          &copy; 2026 tuotekuvasi.fi - Powered by Fal.ai & Supabase
        </footer>
      </div>
    </main>
  );
}
