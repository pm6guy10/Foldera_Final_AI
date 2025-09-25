import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, Settings, Shield } from "lucide-react";

interface AuditLogItem {
  id: string;
  filename: string;
  status: 'scanning' | 'conflict' | 'fixing' | 'protected';
  timestamp: Date;
}

const statusConfig = {
  scanning: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'border-green-500/20',
    dotColor: 'bg-green-500',
    message: 'Scanned - Clean'
  },
  conflict: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'border-yellow-500/20',
    dotColor: 'bg-yellow-500',
    message: 'Conflict Detected'
  },
  fixing: {
    icon: Settings,
    color: 'text-primary',
    bgColor: 'border-primary/20',
    dotColor: 'bg-primary',
    message: 'Auto-Fixing...'
  },
  protected: {
    icon: Shield,
    color: 'text-green-500',
    bgColor: 'border-green-500/20',
    dotColor: 'bg-green-500',
    message: 'Protected & Compliant'
  }
};

export default function AuditLogVisualization() {
  const [items, setItems] = useState<AuditLogItem[]>([]);

  useEffect(() => {
    const initialItems: AuditLogItem[] = [
      {
        id: '1',
        filename: 'contract_v2.docx',
        status: 'scanning',
        timestamp: new Date()
      },
      {
        id: '2', 
        filename: 'financial_report_Q3.xlsx',
        status: 'conflict',
        timestamp: new Date()
      },
      {
        id: '3',
        filename: 'financial_report_Q3.xlsx',
        status: 'fixing',
        timestamp: new Date()
      },
      {
        id: '4',
        filename: 'financial_report_Q3.xlsx', 
        status: 'protected',
        timestamp: new Date()
      }
    ];

    // Animate items appearing one by one
    initialItems.forEach((item, index) => {
      setTimeout(() => {
        setItems(prev => [...prev, item]);
      }, index * 500);
    });
  }, []);

  return (
    <div className="bg-background border border-border rounded-lg p-8 glow-border" data-testid="audit-log-visualization">
      <div className="space-y-4">
        {items.map((item, index) => {
          const config = statusConfig[item.status];
          const IconComponent = config.icon;
          
          return (
            <div
              key={item.id}
              className={`audit-log-item flex items-center justify-between p-4 bg-card rounded-lg border ${config.bgColor}`}
              style={{ animationDelay: `${index * 0.1}s` }}
              data-testid={`audit-log-item-${item.id}`}
            >
              <div className="flex items-center">
                <div className={`w-3 h-3 ${config.dotColor} rounded-full mr-4`}></div>
                <span className="font-mono text-sm" data-testid={`filename-${item.id}`}>
                  {item.filename}
                </span>
              </div>
              <div className={`flex items-center ${config.color}`}>
                <IconComponent className="mr-2 h-4 w-4" />
                <span className="text-sm" data-testid={`status-${item.id}`}>
                  {config.message}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-muted-foreground text-sm">
          <CheckCircle className="inline mr-2 h-4 w-4" />
          Real-time document protection and compliance monitoring
        </p>
      </div>
    </div>
  );
}
