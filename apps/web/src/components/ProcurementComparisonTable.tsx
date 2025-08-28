import React from 'react';

interface ComparisonData {
  step: string;
  blackLiving: string;
  generalPurchasing: string;
}

const comparisonData: ComparisonData[] = [
  {
    step: "下訂金額",
    blackLiving: "30% 訂金",
    generalPurchasing: "全額＋5~8%代購費"
  },
  {
    step: "採購方式",
    blackLiving: "向美國席夢思原廠下單",
    generalPurchasing: "美國零售網站購買"
  },
  {
    step: "倉儲費用",
    blackLiving: "黑哥自有倉庫，免倉儲費",
    generalPurchasing: "美國/台灣倉另收費"
  },
  {
    step: "出口方式",
    blackLiving: "整櫃出口，穩定快速",
    generalPurchasing: "散櫃合運，不穩定"
  },
  {
    step: "物流配送",
    blackLiving: "黑哥自有物流，免物流費",
    generalPurchasing: "第三方物流需付費"
  },
  {
    step: "價格透明度",
    blackLiving: "高，全流程直營",
    generalPurchasing: "低，多重加價成本"
  }
];

export default function ProcurementComparisonTable() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">採購流程比較</h2>
        
        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-black text-white">
                  <th className="py-4 px-6 text-left font-semibold">流程步驟</th>
                  <th className="py-4 px-6 text-left font-semibold">黑哥直營進口 (Black Living)</th>
                  <th className="py-4 px-6 text-left font-semibold">一般代購模式</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr 
                    key={index} 
                    className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}
                  >
                    <td className="py-4 px-6 font-medium text-gray-900">{row.step}</td>
                    <td className="py-4 px-6 text-green-700 font-medium">{row.blackLiving}</td>
                    <td className="py-4 px-6 text-red-600">{row.generalPurchasing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {comparisonData.map((row, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-lg mb-4 text-center text-gray-900">{row.step}</h3>
              
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-semibold text-green-800 mb-2">黑哥直營進口</h4>
                  <p className="text-green-700">{row.blackLiving}</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                  <h4 className="font-semibold text-red-800 mb-2">一般代購模式</h4>
                  <p className="text-red-700">{row.generalPurchasing}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center bg-black text-white p-8 rounded-lg">
          <h3 className="text-2xl font-bold mb-4">立即聯絡我們，享源頭價格 🛒</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <a
              href="https://line.me/R/ti/p/@blackking"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 font-semibold rounded-lg transition-colors"
            >
              Line 線上諮詢
            </a>
            <a
              href="/appointment"
              className="bg-white text-black px-8 py-3 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              預約門市試躺
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}