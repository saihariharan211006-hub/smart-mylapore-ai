import React from 'react';
import { Award, Compass, Layers } from 'lucide-react';

interface ModelMetric {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
}

interface MLMetrics {
  best_model_name: string;
  comparison: {
    [key: string]: ModelMetric;
  };
  confusion_matrix: number[][];
  labels: string[];
}

interface ChartsProps {
  metrics: MLMetrics;
}

export const Charts: React.FC<ChartsProps> = ({ metrics }) => {
  const models = Object.keys(metrics.comparison);
  const selectedModel = metrics.best_model_name;

  return (
    <div className="glass-panel p-5 flex flex-col gap-4 select-none animate-float-medium" id="charts-panel-container">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <h3 className="text-xs font-black tracking-wider text-white uppercase flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-purple-400" /> Model Benchmark
        </h3>
        <span className="text-[9px] text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded font-bold font-mono">
          F1 Optim
        </span>
      </div>
      
      {/* Accuracy bars */}
      <div className="flex flex-col gap-2.5">
        {models.map(m => {
          const acc = metrics.comparison[m].accuracy;
          const isBest = m === selectedModel;
          return (
            <div key={m} className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px]">
                <span className={isBest ? 'text-electric-cyan font-bold flex items-center gap-1' : 'text-gray-400'}>
                  {isBest && <Award className="w-3 h-3 text-electric-cyan animate-pulse" />}
                  {m}
                </span>
                <span className="text-white font-bold font-mono">{acc}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${acc}%`,
                    background: isBest ? 'linear-gradient(135deg, #00E5FF, #3B82F6)' : 'rgba(255,255,255,0.1)',
                    boxShadow: isBest ? '0 0 10px rgba(0, 229, 255, 0.4)' : 'none'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Confusion Matrix */}
      <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
        <div className="flex justify-between items-center">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Confusion Matrix</h4>
          <span className="text-[8px] text-electric-cyan font-mono bg-white/5 px-1.5 py-0.5 rounded">Scikit-Learn</span>
        </div>
        
        <div className="grid grid-cols-4 gap-1 text-center font-mono text-[9px] mt-1.5">
          {/* Header Row */}
          <div className="text-[8px] text-gray-500 self-center">Act \ Pred</div>
          <div className="bg-white/5 p-1 text-gray-400 rounded">Low</div>
          <div className="bg-white/5 p-1 text-gray-400 rounded">Mod</div>
          <div className="bg-white/5 p-1 text-gray-400 rounded">Heavy</div>

          {/* Row 1 */}
          <div className="bg-white/5 p-1 text-gray-400 rounded self-center text-[7px] uppercase font-bold">Low</div>
          <div className="bg-emerald-500/20 text-emerald-400 font-bold p-1.5 rounded border border-emerald-500/20">{metrics.confusion_matrix[0][0]}</div>
          <div className="bg-white/5 text-gray-500 p-1.5 rounded">{metrics.confusion_matrix[0][1]}</div>
          <div className="bg-white/5 text-gray-500 p-1.5 rounded">{metrics.confusion_matrix[0][2]}</div>

          {/* Row 2 */}
          <div className="bg-white/5 p-1 text-gray-400 rounded self-center text-[7px] uppercase font-bold">Mod</div>
          <div className="bg-white/5 text-gray-500 p-1.5 rounded">{metrics.confusion_matrix[1][0]}</div>
          <div className="bg-amber-500/20 text-amber-400 font-bold p-1.5 rounded border border-amber-500/20">{metrics.confusion_matrix[1][1]}</div>
          <div className="bg-white/5 text-gray-500 p-1.5 rounded">{metrics.confusion_matrix[1][2]}</div>

          {/* Row 3 */}
          <div className="bg-white/5 p-1 text-gray-400 rounded self-center text-[7px] uppercase font-bold">Heavy</div>
          <div className="bg-white/5 text-gray-500 p-1.5 rounded">{metrics.confusion_matrix[2][0]}</div>
          <div className="bg-white/5 text-gray-500 p-1.5 rounded">{metrics.confusion_matrix[2][1]}</div>
          <div className="bg-red-500/20 text-red-400 font-bold p-1.5 rounded border border-red-500/20">{metrics.confusion_matrix[2][2]}</div>
        </div>
      </div>
    </div>
  );
};
