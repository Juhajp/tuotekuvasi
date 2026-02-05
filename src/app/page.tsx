'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ImageIcon, Loader2, Sparkles, RefreshCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { generateProductImage } from './actions/generate';
import { Separator } from '@/components/ui/separator';

const THEMES = [
  { id: 'studio', label: 'Professional Studio', prompt: 'in a professional studio setting, high quality, commercial photography, clean background, soft lighting' },
  { id: 'street', label: 'Urban Street', prompt: 'on a modern urban street, natural daylight, blurred city background, high fashion photography' },
  { id: 'nature', label: 'Nature / Forest', prompt: 'in a lush green forest, natural sunlight filtering through leaves, organic atmosphere' },
  { id: 'beach', label: 'Tropical Beach', prompt: 'on a sunny tropical beach, white sand, turquoise water in background, bright summer lighting' },
  { id: 'minimal', label: 'Minimalist', prompt: 'on a minimalist pedestal, neutral colors, architectural shadows, high-end aesthetic' },
];

const MODELS = [
  { id: 'gpt-image-1.5/edit', label: 'GPT Image 1.5 Edit' },
  { id: 'gemini-25-flash-image/edit', label: 'Gemini 2.5 Flash Edit' },
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>(THEMES[0].id);
  const [model, setModel] = useState<string>(MODELS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
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
    const selectedTheme = THEMES.find(t => t.id === theme);
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('backgroundPrompt', selectedTheme?.prompt || '');
    formData.append('model', model);

    try {
      const response = await generateProductImage(formData);
      
      if (response.success && response.data) {
        setResult({
          original: response.data.original_image_url,
          generated: response.data.generated_image_url || ''
        });
        toast.success("Kuva generoitu onnistuneesti!");
      } else {
        toast.error(response.error || "Generointi epäonnistui.");
      }
    } catch (error) {
      toast.error("Odottamaton virhe tapahtui.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
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
            Luo ammattitasoisia tuotekuvia sekunneissa tekoälyn avulla. 
            Lataa kuva, valitse teema ja anna palaa.
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
                Lataa kuva tuotteestasi (mieluiten tasaisella taustalla)
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Valitse malli</label>
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

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Valitse teema</label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder="Valitse teema" />
                    </SelectTrigger>
                    <SelectContent>
                      {THEMES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                asChild
              >
                <a href={result.generated} download="tuotekuva.png">
                  Lataa kuva
                </a>
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
