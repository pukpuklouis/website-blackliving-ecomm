import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@blackliving/ui";
import { useEffect, useState } from "react";
import { AddressManager } from "../profile/AddressManager";
import { PasswordModal } from "../profile/PasswordModal";
import { ProfileForm } from "../profile/ProfileForm";

type ProfileTabsProps = {
  className?: string;
};

function ProfileTabs({ className }: ProfileTabsProps) {
  const [mounted, setMounted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Client-side hydration safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // Message handlers
  const handleError = (error: string) => {
    setErrorMessage(error);
    setTimeout(() => setErrorMessage(""), 5000);
  };

  // Show loading state during hydration
  if (!mounted) {
    return (
      <div className={`space-y-6 ${className || ""}`}>
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2" />
          <span className="ml-3">載入中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className || ""}`}>
      {/* Global Messages */}
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs className="space-y-6" defaultValue="profile">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">基本資料</TabsTrigger>
          <TabsTrigger value="addresses">地址管理</TabsTrigger>
          <TabsTrigger value="payment">付款方式</TabsTrigger>
          <TabsTrigger value="security">安全設定</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm onError={handleError} />
        </TabsContent>

        <TabsContent value="addresses">
          <AddressManager onError={handleError} />
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent className="space-y-6" value="payment">
          <Card>
            <CardHeader>
              <CardTitle>付款方式與優惠</CardTitle>
              <CardDescription>
                聯繫客服取得更好的報價與付款選項
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Line@ Contact Card */}
              <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500">
                      <svg
                        aria-hidden="true"
                        className="h-6 w-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800 text-lg">
                        聯繫專業客服
                      </h3>
                      <p className="text-green-700">
                        透過 Line@ 獲得專屬優惠報價
                      </p>
                    </div>
                  </div>
                  <Button
                    asChild
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    <a
                      href="https://line.me/R/ti/p/@blackliving"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <svg
                        aria-hidden="true"
                        className="mr-2 h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                      </svg>
                      聯繫客服
                    </a>
                  </Button>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                  <div className="flex items-center text-green-700">
                    <svg
                      aria-hidden="true"
                      className="mr-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                    專業產品諮詢
                  </div>
                  <div className="flex items-center text-green-700">
                    <svg
                      aria-hidden="true"
                      className="mr-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                    客製化優惠方案
                  </div>
                  <div className="flex items-center text-green-700">
                    <svg
                      aria-hidden="true"
                      className="mr-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                    免費到府試躺
                  </div>
                </div>
              </div>

              {/* Payment Methods Section */}
              <div>
                <h3 className="mb-4 font-semibold text-lg">可用付款方式</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-center space-x-3 rounded-lg border p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">信用卡付款</h4>
                      <p className="text-muted-foreground text-sm">
                        Visa、Mastercard、JCB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 rounded-lg border p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">銀行轉帳</h4>
                      <p className="text-muted-foreground text-sm">
                        ATM 轉帳、網路銀行
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 rounded-lg border p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">貨到付款</h4>
                      <p className="text-muted-foreground text-sm">
                        現金付款給配送人員
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 rounded-lg border p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">分期付款</h4>
                      <p className="text-muted-foreground text-sm">
                        信用卡分期、無息分期
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Offers */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500">
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="mb-1 font-medium text-amber-800">
                      特別優惠
                    </h4>
                    <p className="mb-2 text-amber-700 text-sm">
                      透過 Line@ 客服諮詢，享有以下專屬優惠：
                    </p>
                    <ul className="space-y-1 text-amber-700 text-sm">
                      <li>• 床墊優惠價格諮詢</li>
                      <li>• 免費到府試躺服務</li>
                      <li>• 客製化分期付款方案</li>
                      <li>• 舊床回收折抵優惠</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-6" value="security">
          <Card>
            <CardHeader>
              <CardTitle>安全設定</CardTitle>
              <CardDescription>管理您的帳號安全與登入設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h4 className="font-medium">變更密碼</h4>
                    <p className="text-muted-foreground text-sm">
                      更新您的帳號密碼
                    </p>
                  </div>
                  <PasswordModal onError={handleError} />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center">
                      <svg
                        aria-hidden="true"
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">社群帳號連結</h4>
                      <p className="text-muted-foreground text-sm">
                        管理您的 Google 登入連結
                      </p>
                    </div>
                  </div>
                  <div id="social-connections">
                    <Badge
                      className="border-green-200 bg-green-100 text-green-800"
                      variant="secondary"
                    >
                      <svg
                        aria-hidden="true"
                        className="mr-1 h-3 w-3"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Google 已連結
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProfileTabs;
