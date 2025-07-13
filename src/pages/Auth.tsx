import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateEmail, validatePassword, validateName, checkRateLimit } from '@/lib/validation';
export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attemptCount, setAttemptCount] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState<number>(0);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    signIn,
    signUp,
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Enhanced rate limiting using utility function
  const isRateLimited = () => {
    return !checkRateLimit('login_attempts', 5, 600000); // 5 attempts per 10 minutes
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check rate limiting
    if (isRateLimited()) {
      setErrors({
        general: 'Muitas tentativas de login. Tente novamente em 10 minutos.'
      });
      return;
    }
    setIsLoading(true);
    setErrors({});

    // Enhanced validation
    const newErrors: Record<string, string> = {};
    if (!validateEmail(loginForm.email)) {
      newErrors.email = 'Email inválido';
    }
    const passwordValidation = validatePassword(loginForm.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message || 'Senha inválida';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    // Update attempt tracking
    setAttemptCount(prev => prev + 1);
    setLastAttemptTime(Date.now());
    const {
      error
    } = await signIn(loginForm.email, loginForm.password);
    if (error) {
      // Security: Use generic error messages
      setErrors({
        general: 'Credenciais inválidas'
      });
    } else {
      // Reset attempt count on successful login
      setAttemptCount(0);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta."
      });
      navigate('/');
    }
    setIsLoading(false);
  };
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Enhanced validation
    const newErrors: Record<string, string> = {};

    // Name validation
    const nameValidation = validateName(signupForm.name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.message || 'Nome inválido';
    }

    // Email validation
    if (!validateEmail(signupForm.email)) {
      newErrors.email = 'Email inválido';
    }

    // Password validation
    const passwordValidation = validatePassword(signupForm.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message || 'Senha inválida';
    }

    // Password confirmation
    if (signupForm.password !== signupForm.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }
    const {
      error
    } = await signUp(signupForm.email, signupForm.password, signupForm.name);
    if (error) {
      // Security: Use generic error messages
      setErrors({
        general: 'Erro ao criar conta. Tente novamente.'
      });
    } else {
      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar a conta."
      });
    }
    setIsLoading(false);
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Solar Nova Energia</CardTitle>
          <CardDescription>Sistema de Gestão Solar</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="login-email" type="email" placeholder="seu@email.com" className="pl-10" value={loginForm.email} onChange={e => setLoginForm(prev => ({
                    ...prev,
                    email: e.target.value
                  }))} required />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="login-password" type={showLoginPassword ? "text" : "password"} placeholder="Sua senha" className="pl-10 pr-10" value={loginForm.password} onChange={e => setLoginForm(prev => ({
                    ...prev,
                    password: e.target.value
                  }))} required />
                    <button type="button" className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground" onClick={() => setShowLoginPassword(!showLoginPassword)}>
                      {showLoginPassword ? <EyeOff className="h-4 w-4 px-px mx-[31px]" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                {errors.general && <Alert variant="destructive">
                    <AlertDescription>{errors.general}</AlertDescription>
                  </Alert>}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </> : 'Entrar'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="signup-name" type="text" placeholder="Seu nome completo" className="pl-10" value={signupForm.name} onChange={e => setSignupForm(prev => ({
                    ...prev,
                    name: e.target.value
                  }))} required />
                  </div>
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="signup-email" type="email" placeholder="seu@email.com" className="pl-10" value={signupForm.email} onChange={e => setSignupForm(prev => ({
                    ...prev,
                    email: e.target.value
                  }))} required />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="signup-password" type={showSignupPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres" className="pl-10 pr-10" value={signupForm.password} onChange={e => setSignupForm(prev => ({
                    ...prev,
                    password: e.target.value
                  }))} required />
                    <button type="button" className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground" onClick={() => setShowSignupPassword(!showSignupPassword)}>
                      {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="signup-confirm" type={showConfirmPassword ? "text" : "password"} placeholder="Confirme sua senha" className="pl-10 pr-10" value={signupForm.confirmPassword} onChange={e => setSignupForm(prev => ({
                    ...prev,
                    confirmPassword: e.target.value
                  }))} required />
                    <button type="button" className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>

                {errors.general && <Alert variant="destructive">
                    <AlertDescription>{errors.general}</AlertDescription>
                  </Alert>}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cadastrando...
                    </> : 'Cadastrar'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
}