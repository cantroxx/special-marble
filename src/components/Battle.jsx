// Battle.jsx — 1:1 대전 화면 (연습·봇 모드). 온라인은 net 어댑터로 이후 확장.
import { useReducer, useEffect, useState } from 'react'
import {
  battleReducer,
  createBattleState,
  planBattleMove,
  botChooseSteps,
  rollDice,
  RANK_WIN,
  RANK_LOSE,
  TURNS_PER_PLAYER,
} from '../battleLogic.js'
import { CONFIG } from '../data.js'
import BattleBoard from './BattleBoard.jsx'
import BattleActionPanel from './BattleActionPanel.jsx'

export default function Battle() {
  const [config, setConfig] = useState(null) // null=메뉴 / {mode, names}

  if (!config) return <BattleMenu onStart={setConfig} />
  return <BattleGame key={JSON.stringify(config)} config={config} onExit={() => setConfig(null)} />
}

// ── 모드 선택 메뉴 ──────────────────────────────
function BattleMenu({ onStart }) {
  const [myName, setMyName] = useState('나')
  const [foeName, setFoeName] = useState('친구')

  return (
    <div className="panel" style={{ maxWidth: 560, margin: '0 auto' }}>
      <h2>⚔️ 특산물 대전 — 1:1</h2>
      <div className="compare">
        같은 게임판·시장에서 번갈아 <b>{TURNS_PER_PLAYER}턴</b>씩! 먼저 목표 <b>{CONFIG.goal.toLocaleString()}원</b>{' '}
        도달하거나, 끝났을 때 현금이 많으면 승리! 🏆
      </div>

      <div style={{ margin: '14px 0' }}>
        <label className="battle-label">
          내 이름
          <input className="battle-input" value={myName} onChange={(e) => setMyName(e.target.value)} maxLength={6} />
        </label>
      </div>

      <button
        className="btn btn-purple"
        style={{ marginBottom: 10 }}
        onClick={() => onStart({ mode: 'bot', names: [myName || '나', '또박이 봇'] })}
      >
        🤖 봇과 대전 (혼자 연습)
      </button>

      <div style={{ margin: '10px 0 6px', color: '#8d6e63' }}>또는 한 컴퓨터에서 둘이 번갈아:</div>
      <label className="battle-label" style={{ marginBottom: 8 }}>
        친구 이름
        <input className="battle-input" value={foeName} onChange={(e) => setFoeName(e.target.value)} maxLength={6} />
      </label>
      <button
        className="btn btn-green"
        onClick={() => onStart({ mode: 'local', names: [myName || '나', foeName || '친구'] })}
      >
        👫 둘이 대전 (번갈아 하기)
      </button>

      <div className="online-soon">🌐 온라인 대전(친구와 각자 기기에서)은 곧 추가돼요!</div>
    </div>
  )
}

// ── 대전 진행 ──────────────────────────────────
function BattleGame({ config, onExit }) {
  const [state, dispatch] = useReducer(battleReducer, undefined, () =>
    createBattleState(config.names, config.mode),
  )

  const isBotTurn = config.mode === 'bot' && state.current === 1

  // 봇 자동 진행 (한 동작씩, 볼 수 있게 약간의 딜레이)
  useEffect(() => {
    if (!isBotTurn || state.phase === 'ended') return
    const t = setTimeout(() => {
      if (state.phase === 'ready') {
        dispatch(state.players[1].skipNext ? { type: 'SKIP_TURN' } : { type: 'ROLL', dice: rollDice() })
      } else if (state.phase === 'choose') {
        dispatch({ type: 'MOVE', plan: planBattleMove(state, botChooseSteps(state)) })
      } else if (state.phase === 'action') {
        dispatch({ type: 'BOT_ACTION' })
      }
    }, 850)
    return () => clearTimeout(t)
  }, [state, isBotTurn])

  const actions = {
    roll: () => dispatch({ type: 'ROLL', dice: rollDice() }),
    move: (steps) => dispatch({ type: 'MOVE', plan: planBattleMove(state, steps) }),
    buy: (id) => dispatch({ type: 'BUY', productId: id }),
    sell: (i) => dispatch({ type: 'SELL', index: i }),
    sellAll: () => dispatch({ type: 'SELL_ALL' }),
    answerQuiz: (c) => dispatch({ type: 'ANSWER_QUIZ', choice: c }),
    endTurn: () => dispatch({ type: 'END_TURN' }),
    skipTurn: () => dispatch({ type: 'SKIP_TURN' }),
  }

  return (
    <div>
      <div className="battle-topbar">
        <button className="btn btn-gray back-btn" onClick={onExit}>
          ← 나가기
        </button>
        <div className="battle-players">
          {state.players.map((p, i) => (
            <div key={i} className={`battle-pcard${state.current === i && state.phase !== 'ended' ? ' active' : ''}`}>
              <div className="bp-name">
                {i === 0 ? '🧑‍🌾' : config.mode === 'bot' ? '🤖' : '🧑‍🍳'} {p.name}
              </div>
              <div className="bp-cash">{p.cash.toLocaleString()}원</div>
              <div className="bp-cargo">🎒 {p.cargo.length}/{CONFIG.cargoLimit}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="map-layout" style={{ marginTop: 12 }}>
        <BattleBoard state={state} />

        <div>
          {isBotTurn && state.phase !== 'ended' ? (
            <div className="panel">
              <h2>🤖 {state.players[1].name} 차례</h2>
              <p style={{ color: '#616161' }}>봇이 두는 중이에요…</p>
            </div>
          ) : state.phase !== 'ended' ? (
            <BattleActionPanel state={state} actions={actions} />
          ) : null}

          <div className="panel">
            <h2>활동 기록</h2>
            {state.log.length === 0 ? (
              <p style={{ color: '#9e9e9e', margin: 0 }}>아직 기록이 없어요.</p>
            ) : (
              <ul className="log-list">
                {state.log.map((e, i) => (
                  <li key={i}>{e.message}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {state.phase === 'ended' && (
        <BattleResult state={state} config={config} onRestart={() => dispatch({ type: 'RESTART' })} onExit={onExit} />
      )}
    </div>
  )
}

function BattleResult({ state, config, onRestart, onExit }) {
  const draw = state.winner === 'draw'
  const winnerName = draw ? null : state.players[state.winner].name
  // 사람(플레이어0) 기준 승패 랭크 점수 (온라인에서 Firestore에 기록될 값)
  const humanWon = state.winner === 0
  const rankPts = draw ? Math.round((RANK_WIN + RANK_LOSE) / 2) : humanWon ? RANK_WIN : RANK_LOSE

  return (
    <div className="result-overlay">
      <div className="result-card">
        <div className="grade">{draw ? '🤝' : '🏆'}</div>
        <h2>{draw ? '무승부!' : `${winnerName} 승리!`}</h2>
        <div className="result-cash">
          {state.players[0].name} {state.players[0].cash.toLocaleString()}원 · {state.players[1].name}{' '}
          {state.players[1].cash.toLocaleString()}원
        </div>
        <p style={{ fontSize: 18 }}>
          {config.mode === 'bot' ? '내 랭크 점수' : `${state.players[0].name} 랭크 점수`}: <b>+{rankPts}</b>
          <br />
          <span style={{ fontSize: 14, color: '#8d6e63' }}>(온라인 대전에서는 랭킹에 누적돼요)</span>
        </p>
        <button className="btn btn-primary" onClick={onRestart} style={{ marginBottom: 8 }}>
          🔄 다시 대전
        </button>
        <button className="btn btn-gray" onClick={onExit}>
          나가기
        </button>
      </div>
    </div>
  )
}
