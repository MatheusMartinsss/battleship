import { Card } from "./ui/card"
import { Label } from "./ui/label"


export const WaitingCard = () => {

    return (
        <Card
            className="w-[400px] h-[400px] flex text-center justify-center items-center"
        >
            <Label>Aguardando outro jogador...</Label>
        </Card>
    )
}