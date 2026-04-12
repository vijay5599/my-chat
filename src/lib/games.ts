export const GAME_PREFIX = '🕹️ GAME:TIC_TAC_TOE|'

export type Player = 'X' | 'O' | null

export interface TicTacToeState {
  type: 'TIC_TAC_TOE'
  board: Player[]
  isXNext: boolean
  players: {
    X: { id: string; username: string }
    O: { id: string; username: string }
  }
  winner: Player | 'Draw'
  winningLine: number[] | null
}

export const createInitialGameState = (userX: { id: string; username: string }, userO: { id: string; username: string }): TicTacToeState => ({
  type: 'TIC_TAC_TOE',
  board: Array(9).fill(null),
  isXNext: true,
  players: {
    X: userX,
    O: userO
  },
  winner: null,
  winningLine: null
})

export const calculateWinner = (squares: Player[]) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6]             // diags
  ]
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i]
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: lines[i] }
    }
  }
  if (!squares.includes(null)) return { winner: 'Draw' as const, line: null }
  return null
}

export const handleMove = (state: TicTacToeState, index: number, userId: string): TicTacToeState | null => {
  const currentPlayer = state.isXNext ? 'X' : 'O'
  
  // Validate turn
  if (state.players[currentPlayer].id !== userId) return null
  if (state.board[index] || state.winner) return null

  const newBoard = [...state.board]
  newBoard[index] = currentPlayer

  const result = calculateWinner(newBoard)
  
  return {
    ...state,
    board: newBoard,
    isXNext: !state.isXNext,
    winner: result?.winner || null,
    winningLine: result?.line || null
  }
}
