import { Label } from "./ui/label"

export const WaitingCard = () => {

    return (
        <div
            className="absolute w-[400px] h-[400px] flex items-center justify-center bg-gray-800 bg-opacity-75 z-[999]"
        >
            <div className="p-4 rounded-xl shadow-lg flex">
                <Label className="animate-pulse text-white text-lg font-semibold ">
                    Aguardando jogador...
                </Label>
            </div>
        </div>
    );
}