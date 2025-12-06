import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const DialogContext = React.createContext<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
}>({ open: false, onOpenChange: () => {} });

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    if (!open) return null;

    return (
        <DialogContext.Provider value={{ open, onOpenChange }}>
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                    className="fixed inset-0 bg-black/50"
                    onClick={() => onOpenChange(false)}
                />
                {children}
            </div>
        </DialogContext.Provider>
    );
}

export function DialogContent({ className, children, ...props }: DialogContentProps) {
    const { onOpenChange } = React.useContext(DialogContext);

    return (
        <div
            className={cn(
                "relative z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background rounded-lg shadow-lg p-6",
                className
            )}
            onClick={(e) => e.stopPropagation()}
            {...props}
        >
            <button
                onClick={() => onOpenChange(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
            >
                <X className="h-4 w-4" />
            </button>
            {children}
        </div>
    );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("mb-4", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h2 className={cn("text-2xl font-semibold", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

