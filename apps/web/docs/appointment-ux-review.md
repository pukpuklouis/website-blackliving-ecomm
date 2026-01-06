# 預約試躺功能 UX 審查報告

## 📋 審查概覽

**審查日期**: 2025-12-01  
**審查範圍**: `apps/web/src/pages/appointment.astro` 與相關組件  
**審查重點**: 用戶體驗、可用性、最佳實踐

## 🚨 關鍵 UX 問題

### 1. **自動進行流程反模式** (最嚴重)
**問題描述**:
- 門市選擇和產品選擇在 300ms 後自動跳轉下一步 (`setTimeout(() => nextStep(), 300)`)
- 用戶失去控制權，無法重新考慮選擇
- 造成用戶焦慮和困惑

**影響程度**: 🔴 嚴重  
**修復優先級**: 最高

**解決方案**:
```tsx
// 移除自動跳轉，添加明確的繼續按鈕
const handleStoreSelect = (store) => {
  updateAppointmentData({ selectedStore: store });
  // 移除: setTimeout(nextStep(), 300);
};

<Button onClick={nextStep} disabled={!selectedStore} variant="primary">
  繼續選擇產品
</Button>
```

### 2. **不一致的交互模式** (最嚴重)
**問題描述**:
- 混用自動跳轉、按鈕點擊和 Enter 鍵導航
- 用戶體驗不可預測
- 無障礙性問題

**影響程度**: 🔴 嚴重  
**修復優先級**: 最高

**解決方案**:
- 統一為按鈕驅動的導航模式
- 支援鍵盤導航但保持一致
- 明確的用戶控制

### 3. **認證流程混淆** (嚴重)
**問題描述**:
- 認證模態框在第一步驟就出現
- 用戶不清楚為何需要登入
- 流程中斷感明顯

**影響程度**: 🟡 中等  
**修復優先級**: 高

**解決方案**:
```tsx
// 延遲認證到最終提交
const handleFinalSubmit = async () => {
  // 檢查認證狀態
  if (!isAuthenticated) {
    showAuthModal();
    return;
  }
  // 處理預約提交
};
```

### 4. **表單驗證問題** (中等)
**問題描述**:
- Email 欄位顯示「來自第一步驟」但第一步驟並未收集 Email
- 混亂的文案
- 潛在的數據完整性問題

**影響程度**: 🟡 中等  
**修復優先級**: 高

**解決方案**:
```tsx
// 修復數據流程或更新文案
<div className="email-field">
  <label>Email 地址 *</label>
  <input type="email" value={email} />
  <p className="helper-text">用於發送預約確認通知</p>
</div>
```

### 5. **手機響應式設計疑慮** (中等)
**問題描述**:
- 網格佈局在手機上可能表現不佳
- 間距和字體大小需要調整
- 觸控目標尺寸可能不夠

**影響程度**: 🟡 中等  
**修復優先級**: 中高

**解決方案**:
```tsx
// 手機優先的響應式設計
<div className={`
  grid gap-4 
  sm:grid-cols-1 
  md:grid-cols-2 
  lg:max-w-2xl mx-auto
`}>
  {/* 卡片內容 */}
</div>
```

## 🎯 UX 改進建議

### **重構流程建議**

#### 1. **移除自動進行模式**
- 移除所有 `setTimeout(nextStep(), 300)` 調用
- 添加明確的「繼續」按鈕
- 用戶必須主動選擇進入下一步

#### 2. **實施漸進式披露**
```
步驟 1: 門市選擇 → 顯示門市詳情、營業時間、聯絡資訊
步驟 2: 產品選擇 → 顯示產品圖片、描述、特性
步驟 3: 個人資訊 → 清晰的欄位標籤、即時驗證
步驟 4: 日期時間 → 視覺日曆、可選擇時間段
步驟 5: 審核 → 可編輯摘要、明確的下一步
```

#### 3. **增強進度指示器**
```tsx
// 更有信息的進度步驟
const steps = [
  { id: 'store', title: '選擇門市', description: '選擇就近門市' },
  { id: 'product', title: '選擇產品', description: '挑選試躺產品' },
  { id: 'personal', title: '個人資訊', description: '填寫聯絡方式' },
  { id: 'datetime', title: '預約時間', description: '選擇合適時段' },
  { id: 'review', title: '確認預約', description: '檢查並提交' }
];

<div className="step-indicator">
  {steps.map((step, index) => (
    <div className={`step ${index <= currentStep ? 'active' : 'pending'}`}>
      <span className="step-number">{index + 1}</span>
      <span className="step-title">{step.title}</span>
      <span className="step-description">{step.description}</span>
    </div>
  ))}
</div>
```

#### 4. **改進表單驗證**
```tsx
// 即時驗證與有用訊息
const [validationErrors, setValidationErrors] = useState({});
const [isValidating, setIsValidating] = useState(false);

// 顯示驗證狀態
<input 
  className={`
    form-input
    ${errors.name ? 'border-red-500' : 'border-gray-300'}
    ${touched.name ? 'border-black' : ''}
  `}
  placeholder="請輸入您的姓名"
/>

{errors.name && (
  <p className="error-message">
    <Icon name="alert-circle" />
    {errors.name}
  </p>
)}
```

#### 5. **更好的錯誤處理與恢復**
```tsx
// 內聯錯誤恢復
{hasError && (
  <div className="error-container">
    <div className="error-message">
      <Icon name="alert-triangle" />
      <p>{errorMessage}</p>
    </div>
    <div className="error-actions">
      <Button variant="outline" onClick={retryAction}>
        重試
      </Button>
      <Button variant="ghost" onClick={goToPreviousStep}>
        返回上一步
      </Button>
    </div>
  </div>
)}
```

#### 6. **無障礙性改進**
```tsx
// 適當的焦點管理
const focusManager = {
  previousFocusRef: useRef(null),
  
  onStepEnter: () => {
    focusManager.previousFocusRef.current = document.activeElement;
    firstInputRef.current?.focus();
  },
  
  onStepExit: () => {
    focusManager.previousFocusRef.current?.focus();
  }
};

// ARIA 標籤和角色
<div role="progressbar" 
     aria-valuenow={currentStep} 
     aria-valuemax={steps.length}
     aria-label="預約進度">
```

#### 7. **載入狀態與反饋**
```tsx
// 異步操作的載入指示器
const [isLoading, setIsLoading] = useState(false);

{isLoading && (
  <div className="loading-overlay">
    <Spinner size="lg" />
    <p>載入中...</p>
  </div>
)}
```

## 📊 實施優先級

### **高優先級 (關鍵 UX)**
1. ✅ 移除門市/產品選擇的自動跳轉
2. ✅ 添加明確的繼續按鈕
3. ✅ 修復 Email 欄位數據流程問題
4. ✅ 實施適當的表單驗證

### **中優先級 (增強 UX)**
5. 📱 手機響應式設計
6. 📈 更好的進度指示器
7. 🛠️ 改進錯誤處理
8. ⏳ 載入狀態

### **低優先級 (完善)**
9. ♿ 無障礙性增強
10. ✨ 動畫細節
11. ⌨️ 高級鍵盤導航

## 🔧 具體代碼修改需求

### **替換自動跳轉模式**:
```tsx
// 在 StoreSelectionStep.tsx 和 ProductSelectionStep.tsx 中
// 移除: setTimeout(() => nextStep(), 300);
// 添加: 帶適當狀態管理的繼續按鈕
```

### **添加按鈕狀態管理**:
```tsx
const canProceed = selectedStore && 
                   selectedProduct && 
                   validPersonalInfo && 
                   selectedDateTime;

// 用於啟用/禁用繼續按鈕
<Button 
  onClick={nextStep} 
  disabled={!canProceed || isLoading}
  variant="primary"
>
  {isLoading ? '處理中...' : '繼續'}
</Button>
```

### **改進錯誤邊界**:
```tsx
<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onError={(error) => console.error('預約流程錯誤:', error)}
>
  <MultiStepAppointmentForm />
</ErrorBoundary>
```

## 🎯 成功指標

### **可用性測試指標**:
- 完成率 > 95% (目前估算 < 80%)
- 平均完成時間 < 5 分鐘
- 錯誤率 < 2%
- 用戶滿意度 > 4.5/5

### **技術指標**:
- 首頁載入時間 < 2 秒
- 步驟切換動畫 < 300ms
- 響應式設計覆蓋 100% 設備
- 無障礙性評分 AA 級別

## 📝 總結

目前的預約流程設計存在多個嚴重的 UX 問題，主要是自動進行流程反模式和交互不一致性。這些問題嚴重影響用戶體驗，需要優先修復。

**建議的重構策略**:

1. **立即修復**: 移除自動跳轉，恢復用戶控制權
2. **流程優化**: 統一交互模式，實施漸進式披露
3. **用戶體驗**: 增強視覺設計和反饋機制
4. **技術改進**: 響應式設計和無障礙性

通過系統性地解決這些問題，可以顯著提升預約流程的可用性和用戶滿意度。