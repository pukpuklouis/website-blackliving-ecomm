export default function Footer() {
  return (
    <footer className="bg-stone-50 py-16 px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo Section */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-amber-600 rounded-full"></div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-800 tracking-wider">BLACK LIVING</h3>
                <p className="text-sm text-stone-600 mt-1">黑哥居家</p>
              </div>
            </div>
          </div>

          {/* About Us Section */}
          <div className="md:col-span-1">
            <h4 className="text-lg font-semibold text-stone-800 mb-6">關於我們</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-stone-600 hover:text-stone-800 transition-colors">
                  黑哥居家
                </a>
              </li>
              <li>
                <a href="#" className="text-stone-600 hover:text-stone-800 transition-colors">
                  門市資訊
                </a>
              </li>
            </ul>
          </div>

          {/* Shopping Info Section */}
          <div className="md:col-span-1">
            <h4 className="text-lg font-semibold text-stone-800 mb-6">購物須知</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-stone-600 hover:text-stone-800 transition-colors">
                  保固說明
                </a>
              </li>
              <li>
                <a href="#" className="text-stone-600 hover:text-stone-800 transition-colors">
                  購物說明
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Us Section */}
          <div className="md:col-span-1">
            <h4 className="text-lg font-semibold text-stone-800 mb-6">聯絡我們</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-stone-600 hover:text-stone-800 transition-colors">
                  客戶服務
                </a>
              </li>
              <li>
                <a href="#" className="text-stone-600 hover:text-stone-800 transition-colors">
                  預約參觀
                </a>
              </li>
              <li>
                <a href="#" className="text-stone-600 hover:text-stone-800 transition-colors">
                  異業合作
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom divider */}
        <div className="mt-12 pt-8 border-t border-stone-300">
          <div className="flex justify-center">
            <div className="w-16 h-1 bg-stone-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </footer>
  )
}
