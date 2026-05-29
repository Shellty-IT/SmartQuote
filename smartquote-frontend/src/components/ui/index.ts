// Legacy default exports (preserve existing import paths)
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Select } from './Select';
export { default as Textarea } from './Textarea';
export { default as Modal } from './Modal';
export { default as Badge } from './Badge';
export { default as Card, CardHeader } from './Card';
export { default as EmptyState } from './EmptyState';
export { default as LoadingSpinner, PageLoader } from './LoadingSpinner';
export { default as ConfirmDialog } from './ConfirmDialog';

// Shadcn-style named exports
export { buttonVariants } from './Button';
export { Button as Btn } from './Button';
export {
    Card as CardRoot,
    CardSection,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from './Card';
export { Badge as BadgeRoot, badgeVariants } from './Badge';
export { Input as InputRaw } from './Input';
export { Textarea as TextareaRaw } from './Textarea';
export { Label } from './label';
export { Separator } from './separator';
export { Skeleton, SkeletonLine, SkeletonCircle, SkeletonKPICard, SkeletonOfferRow, SkeletonInsightCard, SkeletonTableRow, SkeletonStatsCard, SkeletonStatsCardWithIcon, SkeletonFilterBar, SkeletonMobileCard } from './Skeleton';
export { Switch } from './switch';
export { Avatar, AvatarImage, AvatarFallback } from './avatar';
export { Progress } from './progress';
export { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from './dialog';
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from './dropdown-menu';
export { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './tooltip';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell } from './table';
export { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from './sheet';
export { Popover, PopoverContent, PopoverTrigger } from './popover';
export { ScrollArea, ScrollBar } from './scroll-area';
export { Alert, AlertTitle, AlertDescription } from './alert';
export { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, AlertDialogTrigger } from './alert-dialog';
export { Checkbox } from './checkbox';
export { Toaster } from './sonner';
export { ToastContainer } from './Toast';
export type { ToastType, ToastData } from './Toast';
