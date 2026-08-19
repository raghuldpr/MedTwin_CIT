import React from 'react';
import { 
  Heart, 
  Brain, 
  Wind, 
  Activity, 
  Flame, 
  Shield, 
  Dumbbell, 
  Bone, 
  Sparkles,
  Layers
} from 'lucide-react';

export interface OrganSelectorItem {
  id: string;
  name: string;
  status: string;
  statusColor?: 'emerald' | 'blue' | 'rose' | 'amber';
  iconType: 'heart' | 'brain' | 'lungs' | 'kidneys' | 'liver' | 'stomach' | 'bladder' | 'muscles' | 'bones' | 'skin';
}

interface OrganSelectorProps {
  item: OrganSelectorItem;
  isActive?: boolean;
  onClick: () => void;
  align?: 'left' | 'right';
  variant?: 'light' | 'dark';
}

export const OrganSelector: React.FC<OrganSelectorProps> = ({
  item,
  isActive = false,
  onClick,
  align = 'left',
  variant = 'light',
}) => {
  const getIcon = () => {
    switch (item.iconType) {
      case 'heart':
        return <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />;
      case 'brain':
        return <Brain className="w-5 h-5 text-purple-500" />;
      case 'lungs':
        return <Wind className="w-5 h-5 text-rose-400" />;
      case 'kidneys':
        return <Activity className="w-5 h-5 text-red-500" />;
      case 'liver':
        return <Activity className="w-5 h-5 text-rose-600" />;
      case 'stomach':
        return <Flame className="w-5 h-5 text-orange-500" />;
      case 'bladder':
        return <Activity className="w-5 h-5 text-amber-500" />;
      case 'muscles':
        return <Dumbbell className="w-5 h-5 text-rose-500" />;
      case 'bones':
        return <Bone className="w-5 h-5 text-sky-500" />;
      case 'skin':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      default:
        return <Activity className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColorClass = () => {
    if (variant === 'dark') {
      return 'text-slate-400';
    }
    return 'text-slate-500';
  };

  if (variant === 'dark') {
    return (
      <button
        onClick={onClick}
        className={`group flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-200 text-left cursor-pointer ${
          isActive
            ? 'bg-blue-600/30 border border-blue-500/50 shadow-lg shadow-blue-900/30'
            : 'bg-slate-900/60 border border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-700'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 ${
            isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-300'
          }`}
        >
          {getIcon()}
        </div>
        <div>
          <div className="text-sm font-medium text-slate-100">{item.name}</div>
          <div className="text-xs text-slate-400">{item.status}</div>
        </div>
      </button>
    );
  }

  // Light Dashboard design matching screenshot
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 p-2 px-3 rounded-2xl transition-all duration-200 text-left cursor-pointer ${
        isActive
          ? 'bg-blue-50/90 border border-blue-200/80 shadow-sm ring-2 ring-blue-500/20'
          : 'bg-white/80 hover:bg-white border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 ${
          isActive ? 'bg-blue-100/80' : 'bg-slate-50'
        }`}
      >
        {getIcon()}
      </div>
      <div>
        <div className={`text-xs font-semibold ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>
          {item.name}
        </div>
        <div className={`text-[11px] font-normal ${getStatusColorClass()}`}>
          {item.status}
        </div>
      </div>
    </button>
  );
};
