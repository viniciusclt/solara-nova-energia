import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { FileText, X, Upload, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FileUploadProps {
  bucketName: string;
  folderPath?: string;
  fileTypes?: string[];
  maxSize?: number; // in MB
  onUploadComplete: (url: string) => void;
  onError?: (error: string) => void;
  currentFileUrl?: string;
}

export function FileUpload({
  bucketName,
  folderPath = '',
  fileTypes = ['application/pdf'],
  maxSize = 10, // Default 10MB
  onUploadComplete,
  onError,
  currentFileUrl
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(currentFileUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setFile(null);
      return;
    }

    const selectedFile = e.target.files[0];
    
    // Validate file type
    if (fileTypes.length > 0 && !fileTypes.includes(selectedFile.type)) {
      setError(`Tipo de arquivo inválido. Tipos permitidos: ${fileTypes.map(type => type.split('/')[1]).join(', ')}`);
      setFile(null);
      e.target.value = '';
      return;
    }

    // Validate file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      setError(`Arquivo muito grande. Tamanho máximo: ${maxSize}MB`);
      setFile(null);
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setProgress(percent);
          },
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      setFileUrl(publicUrl);
      onUploadComplete(publicUrl);
      
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFile(null);
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao fazer upload do arquivo';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!fileUrl) return;

    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/');
      const filePath = urlParts[urlParts.length - 1];

      // Remove file from Supabase Storage
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) throw error;

      setFileUrl(null);
      onUploadComplete('');
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao remover o arquivo';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    }
  };

  const handleViewFile = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file-upload">Upload de Arquivo</Label>
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            accept={fileTypes.join(',')}
            onChange={handleFileChange}
            disabled={uploading}
            className="flex-1"
          />
          {file && !uploading && (
            <Button onClick={handleUpload} disabled={!file}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Tipos permitidos: {fileTypes.map(type => type.split('/')[1]).join(', ')}. 
          Tamanho máximo: {maxSize}MB
        </p>
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground">Enviando... {progress}%</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {fileUrl && (
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
          <FileText className="h-5 w-5 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Arquivo carregado</p>
            <p className="text-xs text-muted-foreground truncate">{fileUrl.split('/').pop()}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleViewFile}>
              <FileText className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}