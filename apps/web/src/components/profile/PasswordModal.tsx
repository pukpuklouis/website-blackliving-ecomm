/**
 * PasswordModal Component
 * Handles password change functionality with proper validation
 */

import React, { useState } from 'react';
import { Button } from '@blackliving/ui';
import { Input } from '@blackliving/ui';
import { Label } from '@blackliving/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@blackliving/ui';
import { Alert, AlertDescription } from '@blackliving/ui';
import { Loader2, Key, Eye, EyeOff } from 'lucide-react';
import { validatePasswordForm } from '../../lib/validation';

interface PasswordModalProps {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const initialFormData: PasswordFormData = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
};

export function PasswordModal({ onSuccess, onError }: PasswordModalProps) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<PasswordFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Handle input changes
  const handleInputChange = (field: keyof PasswordFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const validationErrors = validatePasswordForm(formData);
    if (validationErrors) {
      setErrors(validationErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setShowModal(false);
        setFormData(initialFormData);
        setErrors({});
        onSuccess?.(result.message || '密碼更新成功！');
      } else {
        setErrors({ currentPassword: result.error || '密碼更新失敗' });
        onError?.(result.error || '密碼更新失敗');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '網路錯誤，請稍後再試';
      setErrors({ currentPassword: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      setShowModal(false);
      setFormData(initialFormData);
      setErrors({});
      setShowPasswords({ current: false, new: false, confirm: false });
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    return formData.currentPassword && 
           formData.newPassword && 
           formData.confirmPassword && 
           Object.keys(errors).length === 0;
  };

  return (
    <Dialog open={showModal} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setShowModal(true)}>
          <Key className="h-4 w-4 mr-2" />
          更改密碼
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>更改密碼</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">目前密碼 *</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                className={errors.currentPassword ? 'border-red-500 pr-10' : 'pr-10'}
                placeholder="請輸入目前密碼"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.currentPassword && (
              <p className="text-sm text-red-500">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">新密碼 *</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                className={errors.newPassword ? 'border-red-500 pr-10' : 'pr-10'}
                placeholder="請輸入新密碼"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-red-500">{errors.newPassword}</p>
            )}
            <p className="text-xs text-gray-600">
              密碼至少需要8個字符，包含大小寫字母和數字
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">確認新密碼 *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                placeholder="請再次輸入新密碼"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Security Tips */}
          <Alert>
            <AlertDescription className="text-sm">
              <strong>密碼安全提示：</strong>
              <ul className="mt-1 ml-4 list-disc text-xs space-y-1">
                <li>使用至少8個字符的密碼</li>
                <li>包含大小寫字母、數字</li>
                <li>避免使用個人資訊</li>
                <li>定期更新密碼</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  更新中...
                </>
              ) : (
                '更新密碼'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}