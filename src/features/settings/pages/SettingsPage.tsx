import { Palette, Shield, User } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { ProfileForm } from '@/features/settings/components/ProfileForm';
import { AppearanceForm } from '@/features/settings/components/AppearanceForm';
import { SecurityForm } from '@/features/settings/components/SecurityForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración de Cuenta y Sistema"
        description="Gestiona tu perfil corporativo, preferencias visuales (Dark/Light) y parámetros críticos de seguridad."
      />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span>Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span>Seguridad & API</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span>Apariencia</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm />
        </TabsContent>

        <TabsContent value="security">
          <SecurityForm />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
