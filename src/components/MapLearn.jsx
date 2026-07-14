// MapLearn.jsx — "지도로 배우기" 화면
//  - 도감(explore): 지역을 눌러 그 지역 특산물을 카드로 배웁니다.
//  - 퀴즈(quiz): 특산물이 어느 지역인지 지도에서 찾아 누릅니다.
// 이 화면은 무역 게임과 분리돼 있어(useState만 사용) 서로 영향이 없어요.
import { useState } from 'react'
import KoreaMap from './KoreaMap.jsx'
import {
  MAP_REGION_BY_KEY,
  PRODUCTS,
  PRODUCTS_BY_REGION,
} from '../data.js'
import { estimateMarketRange } from '../gameLogic.js'

// 배열을 섞어서 새 배열로 반환 (퀴즈 문제 순서)
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const ALL_PRODUCT_IDS = Object.keys(PRODUCTS)

export default function MapLearn() {
  const [mode, setMode] = useState('explore') // explore | quiz

  return (
    <div>
      {/* 도감 / 퀴즈 전환 */}
      <div className="submode-tabs">
        <button
          className={`submode ${mode === 'explore' ? 'active' : ''}`}
          onClick={() => setMode('explore')}
        >
          📖 도감 (배우기)
        </button>
        <button
          className={`submode ${mode === 'quiz' ? 'active' : ''}`}
          onClick={() => setMode('quiz')}
        >
          ❓ 퀴즈 (찾기)
        </button>
      </div>

      {mode === 'explore' ? <ExploreMode /> : <QuizMode />}
    </div>
  )
}

// ── 도감 모드 ──────────────────────────────────
function ExploreMode() {
  const [selected, setSelected] = useState('강원')
  const region = MAP_REGION_BY_KEY[selected]
  const productIds = PRODUCTS_BY_REGION[selected] || []

  return (
    <div className="map-layout">
      <div className="panel map-panel">
        <p className="map-hint">지도에서 지역을 눌러 보세요! 👆</p>
        <KoreaMap onRegionClick={setSelected} selected={selected} />
      </div>

      <div className="panel">
        <h2>
          {region.hasProducts ? '🌱' : '📍'} {region.label} 지역
        </h2>
        <div className="compare">{region.desc}</div>

        {region.hasProducts ? (
          <div className="item-list">
            {productIds.map((id) => {
              const p = PRODUCTS[id]
              const range = estimateMarketRange(id)
              return (
                <div key={id} className="item-row">
                  <div className="item-info">
                    <span className="item-name">
                      {p.emoji} {p.name}
                    </span>
                    <span className="item-price">
                      산지가 {p.basePrice.toLocaleString()}원 · 시장에서 팔면 약{' '}
                      {range.low.toLocaleString()}~{range.high.toLocaleString()}원
                    </span>
                  </div>
                </div>
              )
            })}
            <p className="hint">
              산지에서 <b>싸게 사서</b> 시장에서 <b>비싸게 팔면</b> 이윤이 남아요!
            </p>
          </div>
        ) : (
          <p style={{ color: '#616161' }}>이 지역은 이 게임에서 특산물을 다루지 않아요.</p>
        )}
      </div>
    </div>
  )
}

// ── 퀴즈 모드 ──────────────────────────────────
function QuizMode() {
  const [questions, setQuestions] = useState(() => shuffle(ALL_PRODUCT_IDS))
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState(null) // { region, correct }
  const [locked, setLocked] = useState(false) // 정답 맞힌 뒤 잠깐 잠금
  const [showLabels, setShowLabels] = useState(true)

  const finished = index >= questions.length
  const currentId = questions[index]
  const product = currentId ? PRODUCTS[currentId] : null

  function handleClick(regionKey) {
    if (locked || finished) return
    const correct = product.region === regionKey
    setFeedback({ region: regionKey, correct })
    if (correct) {
      setScore((s) => s + 1)
      setLocked(true)
      // 1초 뒤 다음 문제
      setTimeout(() => {
        setFeedback(null)
        setLocked(false)
        setIndex((i) => i + 1)
      }, 1000)
    }
  }

  function restart() {
    setQuestions(shuffle(ALL_PRODUCT_IDS))
    setIndex(0)
    setScore(0)
    setFeedback(null)
    setLocked(false)
  }

  if (finished) {
    const total = questions.length
    return (
      <div className="panel" style={{ textAlign: 'center' }}>
        <h2>🎉 퀴즈 끝!</h2>
        <div className="grade" style={{ fontSize: 72 }}>
          {score} / {total}
        </div>
        <p style={{ fontSize: 20 }}>
          {score === total
            ? '완벽해요! 특산물 박사님 👑'
            : score >= total * 0.7
              ? '잘했어요! 조금만 더 💪'
              : '다시 도전해 볼까요? 🙂'}
        </p>
        <button className="btn btn-primary" onClick={restart}>
          🔄 다시 풀기
        </button>
      </div>
    )
  }

  return (
    <div className="map-layout">
      <div className="panel map-panel">
        <KoreaMap
          onRegionClick={handleClick}
          feedback={feedback}
          showLabels={showLabels}
          clickableOnlyProducts
        />
        <label className="label-toggle">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
          />
          지역 이름 보기
        </label>
      </div>

      <div className="panel">
        <div className="quiz-progress">
          문제 {index + 1} / {questions.length} · 점수 {score}
        </div>
        <div className="event-box">
          <div className="event-title" style={{ fontSize: 48 }}>
            {product.emoji}
          </div>
          <div className="event-text" style={{ fontSize: 20 }}>
            <b>{product.name}</b> 은(는) 어느 지역의 특산물일까요?
            <br />
            지도에서 찾아 눌러 보세요!
          </div>
        </div>

        {feedback && !feedback.correct && (
          <p className="quiz-feedback wrong">❌ 아쉬워요. 다시 한 번 눌러 보세요!</p>
        )}
        {feedback && feedback.correct && (
          <p className="quiz-feedback right">🎯 정답! {product.region} 특산물이에요.</p>
        )}
      </div>
    </div>
  )
}
