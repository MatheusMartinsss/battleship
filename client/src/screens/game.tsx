import { useSocket } from '../context/useSocket'
import { Button } from '../components/ui/button'
import { useParams } from 'react-router-dom';
import { useGameStore } from '@/context/gameStore'
import PlayerGrid from '@/components/PlayerGrid'
import OpponentGrid from '@/components/OpponentGrid'
import GameInfo from '@/components/GameInfo';
import { useEffect } from 'react';
import { useTimer } from '@/lib/useTimer';

function Game() {
    const { socket } = useSocket()
    const { roomId } = useParams(); // Acessa o parâmetro da rota
    const { start, time, formattedTime, isActive, reset } = useTimer()
    const { room, addShip, updateRoom, updateOpponent, role, table1, isPlayerTurn } = useGameStore()


    useEffect(() => {
        const handleRoomUpdate = (room) => {
            updateRoom(room)
    
        }
        const handlePlayerJoined = (opponent) => {
            updateOpponent(opponent)

        }

        const handleCount = (time) => {
            start(60, 'down',)
            addShipFunction()
        }

        const handleSaved = (data) => {
            console.log(data)
        }

        const handleStart = () =>{
            alert('O jogo vai começar...')
        }

        const handlePlayerTurn = () =>{
            
        }

        socket.on('room-update', handleRoomUpdate);
        socket.on('joined', handlePlayerJoined)
        socket.on('count', handleCount)
        socket.on('ships-placed', handleSaved)
        socket.on('start', handleStart)
        socket.on('player-turn', handlePlayerTurn)

        socket.emit('ready', ({ roomId, role }))

        return () => {
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
            orientation: 'horizontal'
        });
        addShip({
            col: 0,
            row: 4,
            type: 'Submarine',
            orientation: 'horizontal'
        })
        addShip({
            col: 0,
            row: 5,
            type: 'Destroyer',
            orientation: 'horizontal'
        })


    }

    const save = () => {
        if (isActive) {
            reset()
        }
        socket.emit('place-ships', table1.ships)
    }
    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-900 via-navy-800 to-blue-900 flex flex-col items-center justify-center p-4 space-y-2'>
            <h1>{formattedTime}</h1>
            <h1>{room.status}</h1>
            <GameInfo />
            <div className='flex flex-col space-y-2'>
                <OpponentGrid />
                <PlayerGrid />
            </div>
            <div>
                <Button onClick={save}>Salvar</Button>
            </div>
        </div>
    )
}
export default Game