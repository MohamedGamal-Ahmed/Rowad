import React from 'react';
import { X, FileSpreadsheet, RefreshCw, UploadCloud, AlertCircle, CheckSquare } from 'lucide-react';

interface TenderImportModalProps {
  onClose: () => void;
  isAr: boolean;
  importStep: 1 | 2;
  setImportStep: (step: 1 | 2) => void;
  dragActive: boolean;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  analyzingFile: boolean;
  triggerAnalysis: () => void;
  executeImportMerge: () => void;
}

export function TenderImportModal({
  onClose,
  isAr,
  importStep,
  setImportStep,
  dragActive,
  handleDrag,
  handleDrop,
  analyzingFile,
  triggerAnalysis,
  executeImportMerge,
}: TenderImportModalProps) {
  return (
    <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-2xl w-full p-8 space-y-6 border border-gray-100 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-red/10 rounded-2xl text-brand-red">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-brand-navy">
                {isAr ? 'معالج استيراد المزايدات والمناقصات' : 'Tender List Import Wizard'}
              </h3>
              <p className="text-xs text-gray-400 font-sans">
                {isAr
                  ? 'مزامنة ومقارنة كشف المناقصات الوارد من إدارة المشتريات والـ PMO.'
                  : 'Reconcile, compare, and verify central Tender Department spreadsheets.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-50 rounded-xl text-gray-400 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {importStep === 1 ? (
          <div className="space-y-6">
            {/* Drag Frame */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all ${
                dragActive ? 'border-brand-red bg-brand-red/5' : 'border-gray-200 bg-gray-50 hover:bg-gray-100/50'
              }`}
            >
              {analyzingFile ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-6">
                  <RefreshCw className="w-10 h-10 text-brand-navy animate-spin" />
                  <p className="text-xs font-bold text-brand-navy font-sans">
                    {isAr ? 'جاري فك تشفير وتدقيق كشوفات إكسيل وقرائتها فنوياً...' : 'Reading schema structure & checking existing project IDs...'}
                  </p>
                  <p className="text-[10px] text-gray-405 font-mono">Parsing excel sheets into pre-award templates</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <UploadCloud className="w-12 h-12 text-gray-400" />
                  <p className="text-sm font-bold text-brand-navy font-sans">
                    {isAr ? 'قم بسحب وإفلات كشف المناقصات (.xlsx, .csv)' : 'Drag & Drop official tender spreadsheet'}
                  </p>
                  <p className="text-xs text-gray-400 font-sans">
                    {isAr ? 'أو انقر لتصفح الملفات يدوياً من جهازك' : 'or click to upload from local machine'}
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={triggerAnalysis}
                      className="px-4 py-2 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                    >
                      {isAr ? 'تحديد الملف يدوياً' : 'Browse Files'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
              <div className="text-xs space-y-1">
                <p className="font-extrabold text-amber-800">{isAr ? 'توجيهات معيارية للمطابقة' : 'Standard Reconciliation Rules'}</p>
                <p className="text-amber-700 leading-relaxed font-sans">
                  The wizard automatically parses project codes. Existing rows will flag for validation if dates or budgets differ, protecting ongoing estimative worksheets.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Reconcile Compare Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-center">
                <span className="text-lg font-black text-emerald-800 block">2</span>
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">{isAr ? 'مشاريع جديدة مكتشفة' : 'New Detected'}</span>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl text-center">
                <span className="text-lg font-black text-blue-800 block">3</span>
                <span className="text-[10px] uppercase font-bold text-blue-600 block">{isAr ? 'مشاريع مكررة ومطابقة' : 'Existing Unchanged'}</span>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-3 rounded-2xl text-center">
                <span className="text-lg font-black text-gray-500 block">1</span>
                <span className="text-[10px] uppercase font-bold text-gray-400 block">{isAr ? 'مؤرشفة تلقائياً' : 'Marked Archive'}</span>
              </div>
            </div>

            {/* Comparative List Previews */}
            <div className="space-y-2 max-h-56 overflow-y-auto premium-scrollbar border-t border-b border-gray-100 py-3">
              <div className="flex justify-between items-center bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/60 text-xs text-sans">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded uppercase">NEW</span>
                  <span className="font-bold text-brand-navy font-mono text-[10px]">PC-2026-RCL</span>
                  <span className="text-gray-500 truncate max-w-[140px] md:max-w-xs">{isAr ? 'منطقة أنفاق ومسار الرياض اللوجستية' : 'Riyadh Central Logistics Ring & Tunnels'}</span>
                </div>
                <span className="font-mono text-emerald-800 font-bold">SAR 520M</span>
              </div>

              <div className="flex justify-between items-center bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/60 text-xs text-sans">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded uppercase">NEW</span>
                  <span className="font-bold text-brand-navy font-mono text-[10px]">PC-2026-JED</span>
                  <span className="text-gray-500 truncate max-w-[140px] md:max-w-xs">{isAr ? 'تحلية مياه الواجهة البحرية لشاطئ جدة' : 'Jeddah Coastal Desalination Pipeline'}</span>
                </div>
                <span className="font-mono text-emerald-800 font-bold">SAR 280M</span>
              </div>

              <div className="flex justify-between items-center bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/60 text-xs text-sans">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] bg-blue-500 text-white font-black px-1.5 py-0.5 rounded uppercase font-bold">SYNC</span>
                  <span className="font-bold text-brand-navy font-mono text-[10px]">PC-2026-NEOM</span>
                  <span className="text-gray-450 truncate max-w-[140px] md:max-w-xs">Neom Spine Tunnel Terminal</span>
                </div>
                <span className="text-gray-400 text-[10px]">{isAr ? 'متزامن' : 'Budget Sync Passed'}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setImportStep(1)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-650 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                {isAr ? 'الرجوع لخيار الرفع' : 'Back to Upload'}
              </button>
              <button
                onClick={executeImportMerge}
                className="px-6 py-2.5 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'تأكيد واستيراد الكشف المختار' : 'Confirm Import & Merge'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
