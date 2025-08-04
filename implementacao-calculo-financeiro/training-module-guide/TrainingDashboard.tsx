import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Video,
  Users,
  Award,
  Clock,
  Play,
  CheckCircle,
  Star,
  Download,
  Calendar,
  Target,
  TrendingUp,
  FileText,
  Zap
} from "lucide-react";

interface TrainingDashboardProps {
  onBackToMenu: () => void;
}

export function TrainingDashboard({ onBackToMenu }: TrainingDashboardProps) {
  const [activeTab, setActiveTab] = useState("courses");
  const { hasPermission } = useAuth();

  const trainingStats = [
    {
      title: "Cursos Disponíveis",
      value: "24",
      change: "+3 novos",
      icon: BookOpen,
      trend: "up"
    },
    {
      title: "Alunos Ativos",
      value: "1.2k",
      change: "+15%",
      icon: Users,
      trend: "up"
    },
    {