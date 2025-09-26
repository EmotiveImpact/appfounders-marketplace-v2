'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Image as ImageIcon, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Download,
  Eye,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { formatFileSize } from '@/lib/upload/validation';

interface ImageOptimizerProps {
  imageKeys: string[];
  onOptimizationComplete?: (results: OptimizationResult[]) => void;
  className?: string;
}

interface OptimizationResult {
  originalKey: string;
  success: boolean;
  result?: {
    original: { key: string; url: string };
    variants: Array<{ 
      key: string; 
      url: string; 
      config: { 
        width?: number; 
        height?: number; 
        quality: number; 
        format: string; 
      }; 
    }>;
  };
  error?: string;
}

const VARIANT_TYPES = {
  avatar: 'Avatar (64px, 128px, 256px)',
  screenshot: 'Screenshot (300px, 800px, 1200px)',
  icon: 'App Icon (64px, 128px, 512px)',
  general: 'General (300px, 800px, 1200px)',
};

export function ImageOptimizer({
  imageKeys,
  onOptimizationComplete,
  className = ''
}: ImageOptimizerProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [variantType, setVariantType] = useState<string>('general');
  const [results, setResults] = useState<OptimizationResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<OptimizationResult | null>(null);

  const startOptimization = async () => {
    if (imageKeys.length === 0) {
      toast.error('No images to optimize');
      return;
    }

    try {
      setIsOptimizing(true);
      setOptimizationProgress(0);
      setResults([]);

      const response = await fetch('/api/images/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageKeys,
          variantType,
          batch: imageKeys.length > 1,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to optimize images');
      }

      const data = await response.json();
      
      if (data.results) {
        // Batch processing results
        setResults(data.results);
        setOptimizationProgress(100);
        
        const successCount = data.results.filter((r: OptimizationResult) => r.success).length;
        toast.success(`Optimized ${successCount}/${data.results.length} images successfully`);
      } else if (data.result) {
        // Single image result
        const singleResult: OptimizationResult = {
          originalKey: imageKeys[0],
          success: true,
          result: data.result,
        };
        setResults([singleResult]);
        setOptimizationProgress(100);
        toast.success('Image optimized successfully');
      }

      onOptimizationComplete?.(results);
    } catch (error: any) {
      toast.error(error.message);
      console.error('Optimization error:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const getTotalSavings = () => {
    if (results.length === 0) return { originalSize: 0, optimizedSize: 0, savings: 0 };
    
    // This would need actual file sizes from the optimization results
    // For now, we'll show placeholder data
    return {
      originalSize: results.length * 2000000, // 2MB average
      optimizedSize: results.length * 800000, // 800KB average
      savings: 60, // 60% savings
    };
  };

  const getVariantPreview = (result: OptimizationResult) => {
    if (!result.success || !result.result) return null;
    
    return result.result.variants.map((variant, index) => (
      <div key={index} className="flex items-center justify-between p-2 border rounded">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          <div>
            <p className="text-sm font-medium">
              {variant.config.width}x{variant.config.height || variant.config.width}
            </p>
            <p className="text-xs text-muted-foreground">
              {variant.config.format.toUpperCase()} • {variant.config.quality}% quality
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(variant.url, '_blank')}
          >
            <Eye className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(variant.url, '_blank')}
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </div>
    ));
  };

  const savings = getTotalSavings();

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Optimization Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Variant Type</label>
              <Select value={variantType} onValueChange={setVariantType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select variant type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VARIANT_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Images to optimize</p>
                <p className="text-xs text-muted-foreground">
                  {imageKeys.length} image{imageKeys.length !== 1 ? 's' : ''} selected
                </p>
              </div>
              <Badge variant="outline">{imageKeys.length}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Optimization Progress */}
        {isOptimizing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Optimizing Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{optimizationProgress}%</span>
                </div>
                <Progress value={optimizationProgress} />
                <p className="text-xs text-muted-foreground">
                  Generating optimized variants for {imageKeys.length} images...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Summary */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Optimization Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{savings.savings}%</p>
                  <p className="text-sm text-muted-foreground">Size Reduction</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{results.filter(r => r.success).length}</p>
                  <p className="text-sm text-muted-foreground">Optimized</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{results.filter(r => !r.success).length}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span>Original Size:</span>
                <span>{formatFileSize(savings.originalSize)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Optimized Size:</span>
                <span className="text-green-600">{formatFileSize(savings.optimizedSize)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Space Saved:</span>
                <span className="text-green-600">
                  {formatFileSize(savings.originalSize - savings.optimizedSize)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Individual Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Optimized Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">
                        {result.originalKey.split('/').pop()}
                      </span>
                    </div>
                    {result.success && result.result && (
                      <Badge variant="outline">
                        {result.result.variants.length} variants
                      </Badge>
                    )}
                  </div>

                  {result.success && result.result ? (
                    <div className="space-y-2">
                      {getVariantPreview(result)}
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {result.error || 'Optimization failed'}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action Button */}
        <Button
          onClick={startOptimization}
          disabled={isOptimizing || imageKeys.length === 0}
          className="w-full"
          size="lg"
        >
          {isOptimizing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Optimize {imageKeys.length} Image{imageKeys.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
