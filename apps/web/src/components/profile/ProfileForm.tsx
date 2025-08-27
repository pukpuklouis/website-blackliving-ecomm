/**
 * ProfileForm Component
 * Replaces the massive vanilla JS form logic in profile.astro
 */

import React, { useState, useEffect } from 'react';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Card, CardContent, CardHeader, CardTitle, Alert, AlertDescription } from '@blackliving/ui';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { useProfile } from '../../hooks/use-profile';
import { validateName, validatePhone, isFormDirty } from '../../lib/validation';
import type { BasicProfile, ProfileUpdateRequest } from '@blackliving/types/';

interface ProfileFormProps {
  className?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

interface FormData {
  name: string;
  phone: string;
  birthday: string;
  gender: string;
  contactPreference: string;
}

export function ProfileForm({ className, onSuccess, onError }: ProfileFormProps) {
  const { 
    profile, 
    loading, 
    error, 
    isDirty, 
    updateProfile, 
    checkDirty, 
    resetForm 
  } = useProfile();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    birthday: '',
    gender: 'unspecified',
    contactPreference: 'email'
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Sync form data with profile
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        birthday: profile.birthday || '',
        gender: profile.gender || 'unspecified',
        contactPreference: profile.contactPreference || 'email'
      });
    }
  }, [profile]);

  // Check if form is dirty whenever data changes
  const [localIsDirty, setLocalIsDirty] = useState(false);
  
  useEffect(() => {
    if (profile) {
      const dirty = 
        formData.name !== (profile.name || '') ||
        formData.phone !== (profile.phone || '') ||
        (formData.birthday !== '' && formData.birthday !== (profile.birthday || '')) ||
        (formData.gender !== 'unspecified' && formData.gender !== (profile.gender || 'unspecified')) ||
        formData.contactPreference !== (profile.contactPreference || 'email');
      
      setLocalIsDirty(dirty);
      checkDirty({
        name: formData.name,
        phone: formData.phone,
        birthday: formData.birthday,
        gender: formData.gender === 'unspecified' ? undefined : formData.gender,
        contactPreference: formData.contactPreference
      });
    }
  }, [formData, profile, checkDirty]);

  // Handle input changes with validation
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSuccessMessage(''); // Clear success message on edit
    
    // Real-time validation
    let error = '';
    switch (field) {
      case 'name':
        error = validateName(value) || '';
        break;
      case 'phone':
        // Only validate phone if it's not empty
        if (value.trim() !== '') {
          error = validatePhone(value) || '';
          console.log('Phone validation:', value, 'Error:', error); // Debug log
        }
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;
    
    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const updateData: ProfileUpdateRequest = {
        name: formData.name,
        phone: formData.phone || undefined,
        birthday: formData.birthday || undefined,
        gender: (formData.gender === 'unspecified' ? undefined : formData.gender) as 'male' | 'female' | 'other' | undefined,
        contactPreference: formData.contactPreference as 'email' | 'phone' | 'sms'
      };
      
      // Remove empty strings and convert to undefined
      Object.keys(updateData).forEach(key => {
        const value = updateData[key as keyof ProfileUpdateRequest];
        if (value === '') {
          delete updateData[key as keyof ProfileUpdateRequest];
        }
      });
      
      const result = await updateProfile(updateData);
      
      if (result.success) {
        setSuccessMessage(result.message || '個人資料更新成功！');
        setLocalIsDirty(false);
        setTimeout(() => setSuccessMessage(''), 3000); // Auto-hide after 3 seconds
      } else {
        onError?.(result.error || '更新失敗');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新失敗';
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form reset
  const handleReset = () => {
    const originalProfile = resetForm();
    if (originalProfile) {
      setFormData({
        name: originalProfile.name || '',
        phone: originalProfile.phone || '',
        birthday: originalProfile.birthday || '',
        gender: originalProfile.gender || 'unspecified',
        contactPreference: originalProfile.contactPreference || 'email'
      });
    }
    setErrors({});
    setSuccessMessage('');
    setLocalIsDirty(false);
  };

  if (loading && !profile) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>個人資料</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">載入中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !profile) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>個人資料</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>個人資料</CardTitle>
      </CardHeader>
      <CardContent>
        {successMessage && (
          <div className="relatvie  w-fit h-6 text-green-600 mb-4 p-2 bg-green-50 rounded-full border border-green-200">
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs w-fit">成功</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">姓名 *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
              placeholder="請輸入姓名"
              required
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label htmlFor="phone">手機號碼</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={errors.phone ? 'border-red-500' : ''}
              placeholder="09xxxxxxxx"
            />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
            <p className="text-sm text-gray-600">格式：09xxxxxxxx</p>
          </div>

          {/* Birthday Field */}
          <div className="space-y-2">
            <Label htmlFor="birthday">生日</Label>
            <Input
              id="birthday"
              type="date"
              value={formData.birthday}
              onChange={(e) => handleInputChange('birthday', e.target.value)}
            />
          </div>

          {/* Gender Field */}
          <div className="space-y-2">
            <Label htmlFor="gender">性別</Label>
            <Select 
              key={formData.gender}
              value={formData.gender} 
              onValueChange={(value) => handleInputChange('gender', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="請選擇性別" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unspecified">未選擇</SelectItem>
                <SelectItem value="male">男性</SelectItem>
                <SelectItem value="female">女性</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contact Preference Field */}
          <div className="space-y-2">
            <Label htmlFor="contactPreference">聯絡方式偏好</Label>
            <Select 
              key={formData.contactPreference}
              value={formData.contactPreference} 
              onValueChange={(value) => handleInputChange('contactPreference', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">電子郵件</SelectItem>
                <SelectItem value="phone">電話</SelectItem>
                <SelectItem value="sms">簡訊</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={!localIsDirty || isSubmitting}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              重置
            </Button>
            
            <Button
              type="submit"
              disabled={!localIsDirty || isSubmitting || Object.keys(errors).some(key => errors[key as keyof FormData])}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  更新資料
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}