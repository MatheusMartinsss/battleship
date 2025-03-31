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
    const { room, addShip, updateRoom, updateOpponent, role, table1, updateEnemyTable, updatePlayerTable } = useGameStore()


    useEffect(() => {
        const handleRoomUpdate = (room: any) => {
            updateRoom(room)

        }
        const handlePlayerJoined = (opponent: any) => {
            updateOpponent(opponent)

        }

        const handleCount = (time: any) => {
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
            updateEnemyTable(data.table2)
            console.log(data)
        }

        const onTakeHit = (data: any) => {
            updatePlayerTable(data.table1)
            console.log(data)
        }
        const handleWinner = (data: any) => {
            alert(`ganhador ${data}`)
        }

        socket.on('room-update', handleRoomUpdate);
        socket.on('winner', handleWinner)
        socket.on('attack-update', onAttack)
        socket.on('hit-update', onTakeHit)
        socket.on('joined', handlePlayerJoined)
        socket.on('count', handleCount)
        socket.on('ships-placed', handleSaved)
        socket.on('start', handleStart)
        socket.on('player-turn', handlePlayerTurn)

        socket.emit('ready', ({ roomId, role }))

        return () => {
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

    const save = () => {
        if (isActive) {
            reset()
        }
        socket.emit('place-ships', table1.ships)
    }
    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-900 via-navy-800 to-blue-900 flex flex-col items-center justify-center p-4 space-y-2'>
            <h1>{formattedTime}</h1>
            <h1>{room?.status}</h1>
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