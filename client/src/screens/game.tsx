import { useSocket } from '../context/useSocket'
import { Button } from '../components/ui/button'
import { useParams } from 'react-router-dom';
import { useGameStore } from '@/context/gameStore'
import PlayerGrid from '@/components/PlayerGrid'
import OpponentGrid from '@/components/OpponentGrid'
import GameInfo from '@/components/GameInfo';
import { useEffect, useState } from 'react';
import { useTimer } from '@/lib/useTimer';
import { WinnerInfo } from '@/components/WinnerInfo';


function Game() {
    const { socket } = useSocket()
    const { roomId } = useParams(); // Acessa o parâmetro da rota
    const { start, formattedTime, isActive, reset } = useTimer()
    const { room, addShip, updateRoom, updateOpponent, role, table1, updateEnemyTable, updatePlayerTable, updatePlayer, resetGame } = useGameStore()
    const [winnerAlert, setWinner] = useState(false)

    useEffect(() => {
        const handleRoomUpdate = (room: any) => {
            updateRoom(room)

        }
        const handlePlayerJoined = (opponent: any) => {
            updateOpponent(opponent.player)

        }

        const handleCount = () => {
            start(60, 'down',)
            addShipFunction()
        }

        const handleSaved = (data: any) => {
            console.log(data)
        }

        const handleStart = () => {
            alert('O jogo vai começar...')
        }
        const handlePlayerTurn = () => {

        }
        const onAttack = (data: any) => {
            console.log(data.table2)
            updateEnemyTable(data.table2)
        }
        const onTakeHit = (data: any) => {
            updatePlayerTable(data.table1)
        }
        const handleWinner = () => {
            setWinner(true)
        }

        const handleReset = () => {
            resetGame()
            handleCount()
        }
        const handleGameUpdate = (data: any) => {
            updateOpponent(data.opponent)
            updatePlayer(data.player)
            updateRoom(data.room)

        }


        socket.on('reset', handleReset)
        socket.on('room-update', handleRoomUpdate);
        socket.on('winner', handleWinner)
        socket.on('attack-update', onAttack)
        socket.on('hit-update', onTakeHit)
        socket.on('joined', handlePlayerJoined)
        socket.on('count', handleCount)
        socket.on('ships-placed', handleSaved)
        socket.on('start', handleStart)
        socket.on('turn-update', handlePlayerTurn)
        socket.on('game-update', handleGameUpdate)
        socket.emit('ready', ({ roomId, role }))

        return () => {
            socket.off('game-update',)
            socket.off('attack-update', onAttack)
            socket.off('hit-update', onTakeHit)
            socket.off('room-update', handleRoomUpdate);
            socket.off('joined', handlePlayerJoined)
            socket.off('count', handleCount)
            socket.off('saved', handleSaved)
        };

    }, [socket])

    const addShipFunction = () => {

        addShip({
            col: 0,
            row: 0,
            type: 'Cruiser',
            orientation: 'horizontal',
            id: 1
        });
        addShip({
            col: 0,
            row: 4,
            type: 'Submarine',
            orientation: 'horizontal',
            id: 2,
        })
        addShip({
            col: 0,
            row: 5,
            type: 'Destroyer',
            orientation: 'horizontal',
            id: 3
        })


    }

    const handleCloseWinnerDialog = () => {
        setWinner(false)
    }

    const save = () => {
        if (isActive) {
            reset()
        }
        socket.emit('place-ships', table1.ships)
    }
    const handlePlayAgain = () => {
        socket.emit('play-again')
    }
    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-900 via-navy-800 to-blue-900 flex flex-col items-center justify-center p-4 space-y-2'>
            <h1>{formattedTime}</h1>
            <h1>{room?.status}</h1>
            <WinnerInfo isWinnerDialogOpen={winnerAlert} handleCloseWinnerDialog={handleCloseWinnerDialog} handlePlayAgain={handlePlayAgain} />
            <GameInfo />
            <div className='flex flex-col space-y-2'>
                <OpponentGrid />
                <PlayerGrid />
            </div>
            <div>
                {room?.status == 'placing' &&
                    <Button
                        onClick={save}
                        className="bg-gradient-to-br from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 active:scale-[0.98] border-2 border-white/20 text-lg font-bold tracking-wide text-white hover:text-emerald-50 shadow-md hover:shadow-lg                        
    transition-all duration-800                      
    px-8 py-4                                        
    rounded-md                                   
    relative overflow-hidden                        
    group                                       
    animate-pulse"
                    >
                        <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                        <span className="relative z-10 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-emerald-200"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2">
                                <path d="M5 13l4 4L19 7" />
                            </svg>
                            FROTA PRONTA!
                        </span>
                        {/* Efeito de "radar" desativado após confirmação */}
                        <span className="absolute top-0 -right-8 w-8 h-full bg-white/20 skew-x-12 animate-radar-sweep" />
                    </Button>
                }
                {room?.status == 'finished' &&
                    <Button
                        onClick={handlePlayAgain}
                        className="bg-gradient-to-br from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 active:scale-[0.98] border-2 border-white/20 text-lg font-bold tracking-wide text-white hover:text-emerald-50 shadow-md hover:shadow-lg                        
    transition-all duration-800                      
    px-8 py-4                                        
    rounded-md                                   
    relative overflow-hidden                        
    group                                       
    animate-pulse"
                    >
                        <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                        <span className="relative z-10 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-emerald-200"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2">
                                <path d="M5 13l4 4L19 7" />
                            </svg>
                            JOGAR NOVAMENTE
                        </span>
                        {/* Efeito de "radar" desativado após confirmação */}
                        <span className="absolute top-0 -right-8 w-8 h-full bg-white/20 skew-x-12 animate-radar-sweep" />
                    </Button>
                }
            </div>
        </div>
    )
}
export default Game