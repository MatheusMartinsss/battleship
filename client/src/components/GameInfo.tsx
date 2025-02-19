import { useGameStore } from '@/context/gameStore'
import { motion } from 'framer-motion'

const GameInfo = () => {
    const { room, currentPlayer, turnId } = useGameStore()

    const render = () => {
        switch (room.status) {
            case 'waiting':
                return (
                    <motion.div /* existing animation */>
                        <div className="flex items-center gap-4">
                            <div className="h-3 w-3 animate-ping rounded-full bg-green-400" />
                            <h1 className="text-2xl font-bold">
                                Esperando outro jogador...
                            </h1>
                        </div>
                    </motion.div>
                );
            case "placing":
                return (
                    <motion.div /* existing animation */>
                        <div className="flex items-center gap-4">
                            <div className="h-3 w-3 animate-ping rounded-full bg-green-400" />
                            <h1 className="text-2xl font-bold">
                                Jogadores conectados, organize sua frota...
                            </h1>
                        </div>
                    </motion.div>
                )
            case "battling":
                return (

                    <motion.div /* existing animation */>
                        <div className="flex items-center gap-4">
                            <div className="h-3 w-3 animate-ping rounded-full bg-green-400" />
                            <h1 className="text-2xl font-bold">
                                Turno de {room.turnId}
                            </h1>
                        </div>
                    </motion.div>
                )
            default:
                return (
                    <div>

                    </div>
                )
        }
    }

    return (
        <div>
            {render()}
        </div>
    )
}

export default GameInfo
