import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBattleResult } from "@/context/gameStore";


interface IWinnerDialog {
    isWinnerDialogOpen: boolean
    handleCloseWinnerDialog: () => void
    handlePlayAgain: () => void
}

export function WinnerInfo({ isWinnerDialogOpen, handleCloseWinnerDialog, handlePlayAgain }: IWinnerDialog) {
    const result = useBattleResult()
    console.log(result)
    const victoryConfig = {
        title: "⚓ Vitória Naval!",
        bg: "from-indigo-900/90 to-purple-900/90",
        text: "bg-gradient-to-r from-cyan-400 to-blue-500",
        message: `Todos os navios de ${result?.opponentName} foram afundados!`,
        button: "Nova Batalha"
    };

    const defeatConfig = {
        title: "💥 Frota Destruída!",
        bg: "from-rose-900/90 to-crimson-900/90",
        text: "bg-gradient-to-r from-rose-300 to-red-500",
        message: `${result?.opponentName} dominou os mares!`,
        button: "Tentar Novamente"
    };

    const config = result?.isVictory ? victoryConfig : defeatConfig;

    return (
        <Dialog open={isWinnerDialogOpen} onOpenChange={handleCloseWinnerDialog}>
            <DialogContent className={cn(
                "overflow-hidden border-0 backdrop-blur-sm",
                "bg-gradient-to-br",
                config.bg,
                "before:absolute before:inset-0 before:bg-noise before:opacity-20",

            )}>
                <div className={cn(
                    "absolute inset-0 animate-shine",
                    result?.isVictory
                        ? "bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]"
                        : "bg-[radial-gradient(circle_at_center,rgba(255,0,0,0.1)_0%,transparent_70%)]"
                )} />

                <DialogHeader>
                    <DialogTitle className={cn(
                        "text-center text-3xl bg-clip-text text-transparent",
                        config.text
                    )}>
                        {config.title}
                    </DialogTitle>
                    <DialogDescription className={cn(
                        "text-center",
                        result?.isVictory ? "text-cyan-100/80" : "text-rose-100/80"
                    )}>
                        {result?.isVictory ? "Domínio dos mares alcançado!" : "Estratégia naval comprometida!"}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-4 relative z-10">
                    <div className={cn(
                        "text-2xl font-bold animate-pulse",
                        result?.isVictory ? "text-cyan-300" : "text-rose-300"
                    )}>
                        {result?.isVictory ? result?.playerName : result?.opponentName}
                    </div>

                    <div className={cn(
                        "text-sm text-center mb-4",
                        result?.isVictory ? "text-cyan-100/90" : "text-rose-100/90"
                    )}>
                        {config.message}
                    </div>

                    <div className={cn(
                        "w-full border-t my-2",
                        result?.isVictory ? "border-cyan-500/30" : "border-rose-500/30"
                    )} />

                    <DialogClose asChild>
                        <Button
                            variant={result?.isVictory? "secondary" : "destructive"}
                            size="lg"
                            onClick={handlePlayAgain}
                            className={cn(
                                "font-semibold shadow-lg",
                                result?.isVictory
                                    ? "bg-cyan-600 hover:bg-cyan-500 text-white"
                                    : "bg-rose-700 hover:bg-rose-600 text-white"
                            )}

                        >
                            {config.button}
                        </Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
}