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
import { cn } from '@/lib/utils';
import { analyzeBodyType, analyzeStyleFromImages, getOutfitRecommendations, generateCapsuleWardrobe, analyzeWardrobeItem } from './services/gemini';
import { UserProfile, WardrobeItem, OutfitSuggestion } from './types';
import { BODY_TYPE_DESCRIPTIONS } from './constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type Step = 'welcome' | 'onboarding' | 'body-result' | 'style' | 'style-result' | 'wardrobe' | 'stylist';

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
  const [pinterestConnected, setPinterestConnected] = useState(false);
  
  // New Item State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    image: ''
  });
  const [isAnalyzingItem, setIsAnalyzingItem] = useState(false);

  // Listen for Pinterest OAuth success
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PINTEREST_AUTH_SUCCESS') {
        setPinterestConnected(true);
        // In a real app, you'd fetch pins here
        // For demo, we'll add some mock pins
        const mockPins = [
          "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=400&q=80",
          "https://images.unsplash.com/photo-1554412930-c74f6391914e?auto=format&fit=crop&w=400&q=80",
          "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=400&q=80"
        ];
        setImages(prev => [...prev, ...mockPins]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handlePinterestConnect = async () => {
    try {
      const response = await fetch('/api/auth/pinterest/url');
      const { url } = await response.json();
      window.open(url, 'pinterest_oauth', 'width=600,height=700');
    } catch (error) {
      console.error('Pinterest connect error:', error);
    }
  };

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
    setStep('body-result');
  };

  const handleAnalyzeStyle = async () => {
    setLoading(true);
    const tags = await analyzeStyleFromImages(images);
    setProfile(prev => ({ ...prev, stylePreferences: tags }));
    setLoading(false);
    setStep('style-result');
  };

  const handleGetRecommendations = async () => {
    setLoading(true);
    const recs = await getOutfitRecommendations(wardrobe, profile.bodyType, profile.stylePreferences, 'Casual Day Out');
    setOutfits(recs);
    setLoading(false);
  };

  const handleGenerateCapsule = async () => {
    setLoading(true);
    const cap = await generateCapsuleWardrobe(profile.budget, profile.bodyType, profile.stylePreferences, wardrobe);
    setCapsule(cap);
    setLoading(false);
  };

  const handleAddItem = async () => {
    if (!newItem.image || !newItem.name) return;
    
    setIsAnalyzingItem(true);
    const analysis = await analyzeWardrobeItem(newItem.image);
    
    const item: WardrobeItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItem.name,
      category: analysis.category,
      color: analysis.color,
      imageUrl: newItem.image,
      tags: analysis.tags
    };
    
    setWardrobe(prev => [...prev, item]);
    setNewItem({ name: '', description: '', image: '' });
    setIsAddDialogOpen(false);
    setIsAnalyzingItem(false);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem(prev => ({ ...prev, image: reader.result as string }));
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
            <button onClick={() => setStep('onboarding')} className={(step === 'onboarding' || step === 'body-result') ? 'text-gold' : ''}>Profile</button>
            <button onClick={() => setStep('style')} className={(step === 'style' || step === 'style-result') ? 'text-gold' : ''}>Style</button>
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

          {step === 'body-result' && (
            <motion.div 
              key="body-result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl space-y-8 text-center py-12"
            >
              <div className="space-y-4">
                <Badge variant="outline" className="border-gold text-gold px-4 py-1">Analysis Complete</Badge>
                <h2 className="text-5xl font-serif">You are an <span className="italic text-gold">{profile.bodyType}</span></h2>
                <div className="glass p-8 rounded-3xl mt-8 max-w-lg mx-auto">
                  <p className="text-lg leading-relaxed text-ink/80">
                    {BODY_TYPE_DESCRIPTIONS[profile.bodyType]}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <Button 
                  onClick={() => setStep('style')}
                  className="bg-ink text-paper hover:bg-ink/90 px-12 py-6 rounded-full text-lg tracking-wide flex gap-2"
                >
                  Continue to Style DNA
                  <ChevronRight className="w-5 h-5" />
                </Button>
                <button 
                  onClick={() => setStep('onboarding')}
                  className="text-xs uppercase tracking-widest font-bold opacity-40 hover:opacity-100 transition-opacity"
                >
                  Retake Measurements
                </button>
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
                  <div className="flex items-center justify-between">
                    <p className="text-ink/70">
                      Upload photos or connect your Pinterest to import your saved looks.
                    </p>
                    {!pinterestConnected ? (
                      <Button 
                        variant="outline" 
                        onClick={handlePinterestConnect}
                        className="rounded-full border-red-600 text-red-600 hover:bg-red-50 flex gap-2"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.41 7.63 11.17-.1-.95-.19-2.41.04-3.45.21-.93 1.35-5.73 1.35-5.73s-.34-.69-.34-1.71c0-1.6 0.93-2.8 2.09-2.8 0.98 0 1.46.74 1.46 1.63 0 .99-.63 2.47-.96 3.84-.27 1.15.58 2.08 1.71 2.08 2.05 0 3.63-2.17 3.63-5.29 0-2.76-1.99-4.7-4.82-4.7-3.28 0-5.21 2.46-5.21 5.01 0 1 .38 2.06.86 2.64.1.11.11.21.08.33-.09.37-.29 1.18-.33 1.33-.05.2-.17.24-.39.14-1.45-.67-2.35-2.79-2.35-4.49 0-3.66 2.66-7.02 7.66-7.02 4.02 0 7.15 2.87 7.15 6.7 0 4-2.52 7.21-6.02 7.21-1.17 0-2.28-.61-2.66-1.33l-.72 2.76c-.26 1.01-.97 2.27-1.44 3.05C8.95 23.82 10.43 24 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0z"/>
                        </svg>
                        Connect Pinterest
                      </Button>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 border-green-200 flex gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Pinterest Connected
                      </Badge>
                    )}
                  </div>
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

          {step === 'style-result' && (
            <motion.div 
              key="style-result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl space-y-8 text-center py-12"
            >
              <div className="space-y-4">
                <Badge variant="outline" className="border-gold text-gold px-4 py-1">Style DNA Decoded</Badge>
                <h2 className="text-5xl font-serif">Your Aesthetic is <span className="italic text-gold">Unique</span></h2>
                <div className="flex flex-wrap justify-center gap-3 mt-8">
                  {profile.stylePreferences.map((tag, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Badge className="bg-ink text-paper px-6 py-2 rounded-full text-sm tracking-wide">
                        {tag}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
                <p className="text-ink/60 max-w-md mx-auto mt-6 leading-relaxed">
                  Aura has identified these key elements from your visual moodboard. These will guide our recommendations for your digital closet and capsule wardrobe.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4 pt-8">
                <Button 
                  onClick={() => setStep('wardrobe')}
                  className="bg-ink text-paper hover:bg-ink/90 px-12 py-6 rounded-full text-lg tracking-wide flex gap-2"
                >
                  Enter Your Closet
                  <ChevronRight className="w-5 h-5" />
                </Button>
                <button 
                  onClick={() => setStep('style')}
                  className="text-xs uppercase tracking-widest font-bold opacity-40 hover:opacity-100 transition-opacity"
                >
                  Edit Moodboard
                </button>
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
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger
                      render={
                        <Button variant="outline" className="rounded-full flex gap-2">
                          <Plus className="w-4 h-4" /> Add Item
                        </Button>
                      }
                    />
                    <DialogContent className="sm:max-w-[425px] bg-paper border-gold/20">
                      <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">Add New Piece</DialogTitle>
                        <DialogDescription>
                          Upload a photo and let Aura analyze its style DNA.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-6 py-4">
                        <div className="flex flex-col items-center gap-4">
                          {newItem.image ? (
                            <div className="relative w-40 h-40 rounded-2xl overflow-hidden border border-gold/20">
                              <img src={newItem.image} className="w-full h-full object-cover" />
                              <button 
                                onClick={() => setNewItem(prev => ({ ...prev, image: '' }))}
                                className="absolute top-2 right-2 bg-ink/60 text-paper p-1 rounded-full hover:bg-ink"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <label className="w-40 h-40 rounded-2xl border-2 border-dashed border-gold/20 flex flex-col items-center justify-center cursor-pointer hover:bg-gold/5 transition-colors">
                              <Camera className="w-8 h-8 text-gold/40" />
                              <span className="text-[10px] uppercase tracking-widest mt-2 font-bold opacity-40">Upload Photo</span>
                              <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                            </label>
                          )}
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Item Name</Label>
                            <Input 
                              id="name" 
                              placeholder="e.g., Vintage Silk Blouse" 
                              value={newItem.name}
                              onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="desc">Description (Optional)</Label>
                            <Textarea 
                              id="desc" 
                              placeholder="Tell Aura more about this piece..." 
                              value={newItem.description}
                              onChange={e => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={handleAddItem} 
                          disabled={!newItem.image || !newItem.name || isAnalyzingItem}
                          className="w-full bg-ink text-paper py-6 rounded-xl"
                        >
                          {isAnalyzingItem ? (
                            <span className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 animate-pulse" /> Analyzing Style...
                            </span>
                          ) : "Add to Closet"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
                        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                          {item.tags.slice(0, 2).map((tag, i) => (
                            <Badge key={i} className="bg-paper/80 text-ink text-[8px] px-1 py-0 backdrop-blur-sm border-none">
                              {tag}
                            </Badge>
                          ))}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {outfits.map((outfit, idx) => (
                      <Card key={idx} className="border-none shadow-xl overflow-hidden bg-white group hover:shadow-2xl transition-all duration-500">
                        <div className="p-4 bg-gold/5 border-b border-gold/10 flex justify-between items-center">
                          <Badge className="bg-gold text-white">{outfit.occasion}</Badge>
                          <Sparkles className="w-4 h-4 text-gold opacity-40" />
                        </div>
                        
                        {/* Collage Layout */}
                        <div className="aspect-square p-4 bg-paper/50 grid grid-cols-2 gap-2 relative">
                          {outfit.items.slice(0, 4).map((itemId, i) => {
                            const item = wardrobe.find(w => w.id === itemId);
                            return item ? (
                              <div 
                                key={i} 
                                className={cn(
                                  "relative overflow-hidden rounded-xl shadow-sm bg-white",
                                  outfit.items.length === 1 ? "col-span-2 row-span-2" : 
                                  outfit.items.length === 2 ? "col-span-1 row-span-2" :
                                  outfit.items.length === 3 && i === 0 ? "col-span-2 row-span-1" : "col-span-1 row-span-1"
                                )}
                              >
                                <img src={item.imageUrl} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                              </div>
                            ) : null;
                          })}
                          <div className="absolute inset-0 bg-ink/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>

                        <CardContent className="p-6 space-y-4">
                          <p className="text-sm italic text-ink/70 leading-relaxed">"{outfit.reasoning}"</p>
                          <Separator className="bg-gold/10" />
                          <div className="grid grid-cols-2 gap-2">
                            {outfit.items.map((itemId, i) => {
                              const item = wardrobe.find(w => w.id === itemId);
                              return item ? (
                                <div key={i} className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-60">
                                  <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                                  <span className="truncate">{item.name}</span>
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
                          <ScrollArea className="h-[550px] rounded-3xl border border-gold/10 p-6 bg-white/40 backdrop-blur-sm">
                            <div className="grid grid-cols-1 gap-4">
                              {capsule.items.map((item: any, idx: number) => (
                                <motion.div 
                                  key={idx}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  className="flex gap-6 p-5 glass rounded-2xl group hover:bg-white/60 transition-all border border-transparent hover:border-gold/20"
                                >
                                  <div className="w-24 h-24 bg-paper rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden">
                                    <ShoppingBag className="w-10 h-10 text-gold opacity-10" />
                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-tighter opacity-20 group-hover:opacity-40 transition-opacity">
                                      {item.category}
                                    </div>
                                  </div>
                                  <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="font-serif text-lg leading-tight">{item.name}</h4>
                                        <Badge variant="secondary" className="mt-1 text-[9px] uppercase tracking-widest bg-gold/10 text-gold border-none">
                                          {item.category}
                                        </Badge>
                                      </div>
                                      <span className="text-gold font-serif text-xl">${item.price}</span>
                                    </div>
                                    <p className="text-xs text-ink/70 leading-relaxed italic">"{item.why}"</p>
                                    <div className="pt-2 flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] font-bold opacity-30">
                                      <Sparkles className="w-3 h-3" />
                                      AI Recommended for your {profile.bodyType} shape
                                    </div>
                                  </div>
                                </motion.div>
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

