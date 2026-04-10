import { useState, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  ShoppingBag, 
  User, 
  LayoutGrid, 
  Plus,
  Trash2,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { analyzeBodyType, analyzeStyleFromImages, getOutfitRecommendations, generateCapsuleWardrobe } from './services/gemini';
import { UserProfile, WardrobeItem, OutfitSuggestion } from './types';

type Step = 'welcome' | 'onboarding' | 'style' | 'wardrobe' | 'stylist';

export default function App() {
  const [step, setStep] = useState<Step>('welcome');
  const [profile, setProfile] = useState<UserProfile>({
    height: 170,
    weight: 60,
    measurements: { bust: 90, waist: 70, hips: 95 },
    bodyType: 'Unknown',
    stylePreferences: [],
    budget: 500
  });
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [outfits, setOutfits] = useState<OutfitSuggestion[]>([]);
  const [capsule, setCapsule] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  // Mock initial wardrobe
  useEffect(() => {
    const savedWardrobe = localStorage.getItem('aura_wardrobe');
    if (savedWardrobe) {
      setWardrobe(JSON.parse(savedWardrobe));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('aura_wardrobe', JSON.stringify(wardrobe));
  }, [wardrobe]);

  const handleAnalyzeBody = async () => {
    setLoading(true);
    const type = await analyzeBodyType(profile.measurements);
    setProfile(prev => ({ ...prev, bodyType: type }));
    setLoading(false);
    setStep('style');
  };

  const handleAnalyzeStyle = async () => {
    setLoading(true);
    const tags = await analyzeStyleFromImages(images);
    setProfile(prev => ({ ...prev, stylePreferences: tags }));
    setLoading(false);
    setStep('wardrobe');
  };

  const handleGetRecommendations = async () => {
    setLoading(true);
    const recs = await getOutfitRecommendations(wardrobe, profile.bodyType, profile.stylePreferences, 'Casual Day Out');
    setOutfits(recs);
    setLoading(false);
  };

  const handleGenerateCapsule = async () => {
    setLoading(true);
    const cap = await generateCapsuleWardrobe(profile.budget, profile.bodyType, profile.stylePreferences);
    setCapsule(cap);
    setLoading(false);
  };

  const addWardrobeItem = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newItem: WardrobeItem = {
          id: Math.random().toString(36).substr(2, 9),
          name: 'New Item',
          category: 'Uncategorized',
          color: 'Mixed',
          imageUrl: reader.result as string,
          tags: []
        };
        setWardrobe([...wardrobe, newItem]);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-4xl flex justify-between items-center mb-12">
        <div className="flex items-center gap-2">
          <Sparkles className="text-gold w-6 h-6" />
          <h1 className="text-3xl font-serif tracking-tight">AURA <span className="italic font-light">Stylist</span></h1>
        </div>
        {step !== 'welcome' && (
          <nav className="hidden md:flex gap-6 text-xs uppercase tracking-widest font-medium opacity-60">
            <button onClick={() => setStep('onboarding')} className={step === 'onboarding' ? 'text-gold' : ''}>Profile</button>
            <button onClick={() => setStep('style')} className={step === 'style' ? 'text-gold' : ''}>Style</button>
            <button onClick={() => setStep('wardrobe')} className={step === 'wardrobe' ? 'text-gold' : ''}>Wardrobe</button>
            <button onClick={() => setStep('stylist')} className={step === 'stylist' ? 'text-gold' : ''}>Stylist</button>
          </nav>
        )}
      </header>

      <main className="w-full max-w-4xl flex-1 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8 py-12"
            >
              <div className="relative inline-block">
                <div className="w-64 h-80 bg-gold/10 oval-mask overflow-hidden mx-auto border border-gold/20">
                  <img 
                    src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80" 
                    alt="Fashion" 
                    className="w-full h-full object-cover opacity-80"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 glass p-4 rounded-full">
                  <Sparkles className="text-gold w-8 h-8" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-5xl font-serif leading-tight">Your Personal <br />AI Style Architect</h2>
                <p className="text-ink/60 max-w-md mx-auto leading-relaxed">
                  Analyze your body type, discover your unique style aesthetic, and build a curated capsule wardrobe that fits your life and budget.
                </p>
              </div>
              <Button 
                onClick={() => setStep('onboarding')}
                className="bg-ink text-paper hover:bg-ink/90 px-12 py-6 rounded-full text-lg tracking-wide"
              >
                Begin Your Journey
              </Button>
            </motion.div>
          )}

          {step === 'onboarding' && (
            <motion.div 
              key="onboarding"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-serif">Body Architecture</h2>
                <Badge variant="outline" className="border-gold text-gold">Step 1 of 4</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-none shadow-sm bg-white/50">
                  <CardHeader>
                    <CardTitle className="text-xl font-serif">Measurements</CardTitle>
                    <CardDescription>Enter your parameters for body type analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Height (cm)</Label>
                      <Slider 
                        value={[profile.height]} 
                        onValueChange={(v) => setProfile({...profile, height: v[0]})} 
                        max={220} min={120} step={1} 
                      />
                      <div className="text-right text-xs font-medium opacity-60">{profile.height} cm</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Bust</Label>
                        <Input 
                          type="number" 
                          value={profile.measurements.bust} 
                          onChange={(e) => setProfile({...profile, measurements: {...profile.measurements, bust: Number(e.target.value)}})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Waist</Label>
                        <Input 
                          type="number" 
                          value={profile.measurements.waist} 
                          onChange={(e) => setProfile({...profile, measurements: {...profile.measurements, waist: Number(e.target.value)}})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hips</Label>
                        <Input 
                          type="number" 
                          value={profile.measurements.hips} 
                          onChange={(e) => setProfile({...profile, measurements: {...profile.measurements, hips: Number(e.target.value)}})}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <div className="glass p-8 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3 text-gold">
                      <Info className="w-5 h-5" />
                      <h3 className="font-medium">Why this matters?</h3>
                    </div>
                    <p className="text-sm text-ink/70 leading-relaxed">
                      Our AI uses these proportions to determine your body silhouette (Hourglass, Pear, etc.), which helps in recommending cuts and fabrics that flatter your natural shape.
                    </p>
                  </div>
                  <Button 
                    onClick={handleAnalyzeBody} 
                    disabled={loading}
                    className="w-full bg-ink text-paper py-8 rounded-2xl text-lg flex gap-2"
                  >
                    {loading ? "Analyzing..." : "Analyze Body Type"}
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'style' && (
            <motion.div 
              key="style"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-serif">Style DNA</h2>
                <Badge variant="outline" className="border-gold text-gold">Step 2 of 4</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <p className="text-ink/70">
                    Upload photos of outfits you love, screenshots from Pinterest, or your own "looks" to help Aura understand your aesthetic.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden bg-ink/5 relative group">
                        <img src={img} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                          className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-paper transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square rounded-xl border-2 border-dashed border-ink/10 flex flex-col items-center justify-center cursor-pointer hover:bg-ink/5 transition-colors">
                      <Plus className="w-6 h-6 text-ink/40" />
                      <span className="text-[10px] uppercase tracking-widest mt-2 font-bold opacity-40">Add Photo</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setImages([...images, reader.result as string]);
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                    </label>
                  </div>
                  <Button 
                    onClick={handleAnalyzeStyle} 
                    disabled={loading || images.length === 0}
                    className="w-full bg-ink text-paper py-8 rounded-2xl text-lg flex gap-2"
                  >
                    {loading ? "Decoding Style..." : "Analyze Style DNA"}
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>

                <div className="glass rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center text-gold">
                    <LayoutGrid className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-serif">Visual Moodboard</h3>
                  <p className="text-sm text-ink/60">
                    Our AI vision model analyzes colors, textures, silhouettes, and patterns to build your personal style profile.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'wardrobe' && (
            <motion.div 
              key="wardrobe"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-serif">Digital Closet</h2>
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <Button variant="outline" className="rounded-full flex gap-2">
                      <Plus className="w-4 h-4" /> Add Item
                    </Button>
                    <input type="file" className="hidden" accept="image/*" onChange={addWardrobeItem} />
                  </label>
                  <Button onClick={() => setStep('stylist')} className="bg-ink text-paper rounded-full">
                    Go to Stylist
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {wardrobe.length === 0 ? (
                  <div className="col-span-full py-20 text-center space-y-4 opacity-40">
                    <ShoppingBag className="w-12 h-12 mx-auto" />
                    <p className="font-serif text-xl">Your closet is empty</p>
                    <p className="text-sm">Start adding your favorite pieces</p>
                  </div>
                ) : (
                  wardrobe.map((item) => (
                    <Card key={item.id} className="overflow-hidden border-none shadow-sm group">
                      <div className="aspect-[3/4] relative">
                        <img src={item.imageUrl} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="icon" 
                            variant="destructive" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => setWardrobe(wardrobe.filter(i => i.id !== item.id))}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-40">{item.category}</p>
                        <p className="font-serif text-lg">{item.name}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {step === 'stylist' && (
            <motion.div 
              key="stylist"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-serif">AI Stylist Studio</h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('wardrobe')} className="rounded-full">Back to Closet</Button>
                </div>
              </div>

              <Tabs defaultValue="outfits" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-ink/5 p-1 rounded-full mb-8">
                  <TabsTrigger value="outfits" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Outfit Mixes</TabsTrigger>
                  <TabsTrigger value="capsule" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Capsule Wardrobe</TabsTrigger>
                </TabsList>

                <TabsContent value="outfits" className="space-y-8">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass p-6 rounded-3xl">
                    <div className="space-y-1">
                      <h3 className="font-serif text-xl">Mix & Match</h3>
                      <p className="text-sm text-ink/60">AI-generated outfits from your current wardrobe</p>
                    </div>
                    <Button onClick={handleGetRecommendations} disabled={loading || wardrobe.length === 0} className="bg-ink text-paper rounded-full px-8">
                      {loading ? "Styling..." : "Generate Outfits"}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {outfits.map((outfit, idx) => (
                      <Card key={idx} className="border-none shadow-md overflow-hidden bg-white">
                        <div className="p-4 bg-gold/5 border-b border-gold/10">
                          <Badge className="bg-gold text-white mb-2">{outfit.occasion}</Badge>
                          <p className="text-sm italic text-ink/70">"{outfit.reasoning}"</p>
                        </div>
                        <CardContent className="p-4 space-y-4">
                          <div className="flex -space-x-4 overflow-hidden">
                            {outfit.items.map((itemId, i) => {
                              const item = wardrobe.find(w => w.id === itemId);
                              return item ? (
                                <div key={i} className="inline-block h-20 w-20 rounded-full ring-4 ring-white overflow-hidden bg-paper">
                                  <img src={item.imageUrl} className="h-full w-full object-cover" />
                                </div>
                              ) : null;
                            })}
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            {outfit.items.map((itemId, i) => {
                              const item = wardrobe.find(w => w.id === itemId);
                              return item ? (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                  <CheckCircle2 className="w-4 h-4 text-gold" />
                                  <span>{item.name}</span>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="capsule" className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="md:col-span-1 border-none shadow-sm bg-white/50 h-fit">
                      <CardHeader>
                        <CardTitle className="font-serif">Budget Settings</CardTitle>
                        <CardDescription>Set your limit for new purchases</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Label>Budget ($)</Label>
                          <Slider 
                            value={[profile.budget]} 
                            onValueChange={(v) => setProfile({...profile, budget: v[0]})} 
                            max={5000} min={100} step={50} 
                          />
                          <div className="text-right text-xl font-serif text-gold">${profile.budget}</div>
                        </div>
                        <Button onClick={handleGenerateCapsule} disabled={loading} className="w-full bg-ink text-paper rounded-xl py-6">
                          {loading ? "Building..." : "Build Capsule"}
                        </Button>
                      </CardContent>
                    </Card>

                    <div className="md:col-span-2 space-y-6">
                      {capsule ? (
                        <div className="space-y-6">
                          <div className="flex justify-between items-end">
                            <h3 className="text-2xl font-serif">Curated Selection</h3>
                            <p className="text-sm font-medium">Est. Total: <span className="text-gold">${capsule.totalEstimatedCost}</span></p>
                          </div>
                          <ScrollArea className="h-[500px] rounded-3xl border border-ink/5 p-4 bg-white/30">
                            <div className="space-y-4">
                              {capsule.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex gap-4 p-4 glass rounded-2xl">
                                  <div className="w-20 h-20 bg-ink/5 rounded-xl flex items-center justify-center">
                                    <ShoppingBag className="w-8 h-8 opacity-20" />
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex justify-between">
                                      <h4 className="font-medium">{item.name}</h4>
                                      <span className="text-gold font-medium">${item.price}</span>
                                    </div>
                                    <p className="text-xs text-ink/60 leading-relaxed">{item.why}</p>
                                    <Badge variant="secondary" className="text-[10px] uppercase tracking-tighter">{item.category}</Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 glass rounded-3xl space-y-4">
                          <ShoppingBag className="w-12 h-12 text-gold opacity-30" />
                          <h3 className="text-xl font-serif">Ready to shop?</h3>
                          <p className="text-sm text-ink/60 max-w-xs">
                            Aura will suggest 10 essential pieces to complete your wardrobe based on your body type and style DNA.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="w-full max-w-4xl mt-12 py-8 border-t border-ink/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.2em] font-bold opacity-40">
        <p>© 2026 AURA STYLIST ARCHIVE</p>
        <div className="flex gap-8">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Support</span>
        </div>
      </footer>
    </div>
  );
}

