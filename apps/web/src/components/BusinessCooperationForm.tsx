import { useState } from 'react';
import { Button, Input, Textarea, Label } from '@blackliving/ui';
import { z } from 'zod';
import TurnstileWidget from './auth/TurnstileWidget';

const formSchema = z.object({
    name: z.string().min(2, '姓名至少需要 2 個字'),
    email: z.string().email('請輸入有效的 E-mail'),
    phone: z.string().min(1, '請輸入聯絡電話'),
    subject: z.string().min(1, '請輸入主旨'),
    content: z.string().min(10, '內容至少需要 10 個字'),
    turnstileToken: z.string().min(1, '請完成驗證'),
});

type FormData = z.infer<typeof formSchema>;

export default function BusinessCooperationForm() {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        phone: '',
        subject: '行銷合作',
        content: '',
        turnstileToken: '',
    });
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name as keyof FormData]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);

        // Validation
        const result = formSchema.safeParse(formData);
        if (!result.success) {
            const fieldErrors: Partial<Record<keyof FormData, string>> = {};
            result.error.issues.forEach((issue) => {
                if (issue.path[0]) {
                    fieldErrors[issue.path[0] as keyof FormData] = issue.message;
                }
            });
            setErrors(fieldErrors);
            setIsSubmitting(false);
            return;
        }

        try {
            const apiUrl = import.meta.env.PUBLIC_API_URL || '';
            const response = await fetch(`${apiUrl}/api/business-cooperation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '提交失敗，請稍後再試');
            }

            setSubmitSuccess(true);
            setFormData({
                name: '',
                email: '',
                phone: '',
                subject: '行銷合作',
                content: '',
                turnstileToken: '',
            });
        } catch (error) {
            console.error('Submission error:', error);
            setSubmitError(error instanceof Error ? error.message : '提交失敗，請稍後再試');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitSuccess) {
        return (
            <div className="text-center py-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">感謝您的聯繫</h3>
                <p className="text-gray-600 mb-8">我們已收到您的合作提案，將盡快與您聯繫。</p>
                <Button onClick={() => setSubmitSuccess(false)} variant="outline">
                    發送新的請求
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">異業合作</h2>
            </div>

            <div className="space-y-4">
                <div>
                    <Label htmlFor="name" className="text-base">
                        ＊姓名：
                    </Label>
                    <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
                        placeholder=""
                    />
                    {errors.name && <p className="text-red-500 text-md mt-1">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="email" className="text-base">
                            ＊E-MAIL：
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
                        />
                        {errors.email && <p className="text-red-500 text-md mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <Label htmlFor="phone" className="text-base">
                            ＊聯絡電話：
                        </Label>
                        <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className={`mt-1 ${errors.phone ? 'border-red-500' : ''}`}
                        />
                        {errors.phone && <p className="text-red-500 text-md mt-1">{errors.phone}</p>}
                    </div>
                </div>

                <div>
                    <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className={`mt-1 ${errors.subject ? 'border-red-500' : ''}`}
                        placeholder="行銷合作"
                    />
                    {errors.subject && <p className="text-red-500 text-md mt-1">{errors.subject}</p>}
                </div>

                <div>
                    <Label htmlFor="content" className="sr-only">
                        內容
                    </Label>
                    <Textarea
                        id="content"
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        rows={6}
                        className={`mt-1 ${errors.content ? 'border-red-500' : ''}`}
                        placeholder="內容"
                    />
                    {errors.content && <p className="text-red-500 text-md mt-1">{errors.content}</p>}
                </div>
            </div>

            {submitError && (
                <div className="p-4 bg-red-50 text-red-700 rounded-md text-md">
                    {submitError}
                </div>
            )}

            <div className="flex flex-col justify-center pt-4">
                <div className="flex justify-center">
                    <TurnstileWidget
                        siteKey={import.meta.env.PUBLIC_TURNSTILE_SITE_KEY}
                        onToken={(token) => {
                            setFormData((prev) => ({ ...prev, turnstileToken: token || '' }));
                            if (token) {
                                setErrors((prev) => ({ ...prev, turnstileToken: undefined }));
                            }
                        }}
                    />
                </div>
                {errors.turnstileToken && (
                    <p className="text-red-500 text-md text-center mt-1">{errors.turnstileToken}</p>
                )}

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-fit mx-auto px-24 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-full"
                >
                    {isSubmitting ? '傳送中...' : '送出'}
                </Button>
            </div>
        </form>
    );
}
