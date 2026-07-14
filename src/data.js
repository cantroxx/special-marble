// ============================================================
// data.js — 게임에 쓰이는 "데이터"만 모아둔 파일
// (규칙/로직은 gameLogic.js 에서 이 데이터를 읽어서 사용합니다)
// 나중에 특산물·게임판을 바꾸고 싶으면 이 파일만 고치면 됩니다.
// ============================================================

// ── 1) 지역(산지) 정보 ─────────────────────────────
// color 는 게임판에서 그 지역 산지 칸을 칠할 색입니다.
export const REGIONS = {
  강원: { name: '강원', color: '#4CAF50', emoji: '⛰️' },
  충청: { name: '충청', color: '#66BB6A', emoji: '🌾' },
  전라: { name: '전라', color: '#43A047', emoji: '🌊' },
  경상: { name: '경상', color: '#388E3C', emoji: '🍎' },
  제주: { name: '제주', color: '#2E7D32', emoji: '🌴' },
}

// ── 2) 특산물 정보 ─────────────────────────────────
// { id, name, region(산지), basePrice(기준가) }
// 산지가 = 기준가, 시장 판매가 = 기준가 × 시장배수(1.5~2.0)
export const PRODUCTS = {
  감자: { id: '감자', name: '감자', region: '강원', basePrice: 300, emoji: '🥔' },
  황태: { id: '황태', name: '황태', region: '강원', basePrice: 800, emoji: '🐟' },
  인삼: { id: '인삼', name: '인삼', region: '충청', basePrice: 1200, emoji: '🌱' },
  딸기: { id: '딸기', name: '딸기', region: '충청', basePrice: 400, emoji: '🍓' },
  굴비: { id: '굴비', name: '굴비', region: '전라', basePrice: 900, emoji: '🐠' },
  김: { id: '김', name: '김', region: '전라', basePrice: 250, emoji: '🍙' },
  사과: { id: '사과', name: '사과', region: '경상', basePrice: 350, emoji: '🍎' },
  대게: { id: '대게', name: '대게', region: '경상', basePrice: 1100, emoji: '🦀' },
  감귤: { id: '감귤', name: '감귤', region: '제주', basePrice: 300, emoji: '🍊' },
  흑돼지: { id: '흑돼지', name: '흑돼지', region: '제주', basePrice: 1000, emoji: '🐷' },
}

// 지역 → 그 지역 특산물 id 목록 (산지 칸에서 살 수 있는 목록)
export const PRODUCTS_BY_REGION = Object.values(PRODUCTS).reduce((acc, p) => {
  ;(acc[p.region] ||= []).push(p.id)
  return acc
}, {})

// ── 3) 칸(cell) 종류 색 ────────────────────────────
export const CELL_COLORS = {
  source: '#4CAF50', // 산지 = 초록
  market: '#FF9800', // 시장 = 주황
  golden: '#9C27B0', // 황금열쇠 = 보라
  corner: '#9E9E9E', // 코너 = 회색
}

// ── 4) 게임판: 사각형 둘레 20칸 ────────────────────
// type: 'corner' | 'source' | 'market' | 'golden'
// corner 는 subtype 으로 start/bigmarket/storm/festival 을 구분합니다.
// grid 는 6×6 격자에서의 위치(row, col, 1부터 시작)입니다.
export const BOARD = [
  { type: 'corner', subtype: 'start', name: '출발', emoji: '🚩', grid: [1, 1] },
  { type: 'source', region: '강원', name: '강원 산지', grid: [1, 2] },
  { type: 'market', name: '시장', emoji: '🏪', grid: [1, 3] },
  { type: 'golden', name: '황금열쇠', emoji: '🔑', grid: [1, 4] },
  { type: 'source', region: '충청', name: '충청 산지', grid: [1, 5] },
  { type: 'corner', subtype: 'bigmarket', name: '큰장', emoji: '🎪', grid: [1, 6] },
  { type: 'market', name: '시장', emoji: '🏪', grid: [2, 6] },
  { type: 'source', region: '전라', name: '전라 산지', grid: [3, 6] },
  { type: 'golden', name: '황금열쇠', emoji: '🔑', grid: [4, 6] },
  { type: 'source', region: '경상', name: '경상 산지', grid: [5, 6] },
  { type: 'corner', subtype: 'storm', name: '폭풍', emoji: '🌀', grid: [6, 6] },
  { type: 'market', name: '시장', emoji: '🏪', grid: [6, 5] },
  { type: 'source', region: '제주', name: '제주 산지', grid: [6, 4] },
  { type: 'golden', name: '황금열쇠', emoji: '🔑', grid: [6, 3] },
  { type: 'market', name: '시장', emoji: '🏪', grid: [6, 2] },
  { type: 'corner', subtype: 'festival', name: '축제', emoji: '🎉', grid: [6, 1] },
  { type: 'source', region: '강원', name: '강원 산지', grid: [5, 1] },
  { type: 'golden', name: '황금열쇠', emoji: '🔑', grid: [4, 1] },
  { type: 'market', name: '시장', emoji: '🏪', grid: [3, 1] },
  { type: 'source', region: '전라', name: '전라 산지', grid: [2, 1] },
]

// ── 5) 황금열쇠 이벤트 목록 ─────────────────────────
// kind:
//   'surge'   특정 특산물 수요 폭등 → 판매가 2배 (게임 끝까지 유지)
//   'harvest' 흉년 → 특정 산지 매입가 1.5배 상승
//   'bonus'   보너스 코인 지급
//   'toll'    통행료 등으로 코인 차감
//   'quiz'    특산물 퀴즈 (정답 시 보너스)
// (surge/harvest 는 어떤 특산물/지역인지 게임 진행 중 랜덤으로 뽑습니다)
export const GOLDEN_EVENTS = [
  { kind: 'surge', title: '수요 폭등!', desc: '특정 특산물 수요가 폭등했어요. 판매가가 2배!' },
  { kind: 'harvest', title: '흉년!', desc: '어느 산지에 흉년이 들어 매입가가 올랐어요.' },
  { kind: 'bonus', title: '길에서 코인 발견!', desc: '길을 가다 코인을 주웠어요.', amount: 500 },
  { kind: 'bonus', title: '착한 상인 보상', desc: '정직한 거래로 보상을 받았어요.', amount: 800 },
  { kind: 'toll', title: '통행료 지불', desc: '다리를 건너며 통행료를 냈어요.', amount: 300 },
  { kind: 'quiz', title: '특산물 퀴즈!', desc: '정답을 맞히면 보너스 코인을 받아요.' },
]

// ── 6) 특산물 퀴즈 ─────────────────────────────────
// answer 는 options 배열의 정답 index 입니다.
export const QUIZZES = [
  {
    question: '한라봉·감귤로 유명한 지역은 어디일까요?',
    options: ['강원', '제주', '충청'],
    answer: 1,
    reward: 700,
  },
  {
    question: '황태와 감자로 유명한 지역은 어디일까요?',
    options: ['강원', '전라', '경상'],
    answer: 0,
    reward: 700,
  },
  {
    question: '굴비와 김으로 유명한 지역은 어디일까요?',
    options: ['경상', '충청', '전라'],
    answer: 2,
    reward: 700,
  },
  {
    question: '인삼으로 특히 유명한 지역은 어디일까요?',
    options: ['충청', '제주', '강원'],
    answer: 0,
    reward: 700,
  },
  {
    question: '대게로 유명한 항구가 있는 지역은 어디일까요?',
    options: ['전라', '경상', '제주'],
    answer: 1,
    reward: 700,
  },
]

// ── 7) 게임 기본 설정값 ────────────────────────────
export const CONFIG = {
  startCash: 3000, // 시작 자금
  goal: 10000, // 목표 자금
  maxTurns: 30, // 최대 턴 수
  cargoLimit: 10, // 짐칸(최대 보유 개수)
  salary: 1500, // 출발점을 지날 때(한 바퀴 완주) 봉급
  marketMin: 1.5, // 시장 판매 배수 최소
  marketMax: 2.0, // 시장 판매 배수 최대
  bigMarketMin: 2.0, // 큰장 판매 배수 최소
  bigMarketMax: 2.5, // 큰장 판매 배수 최대
  harvestMultiplier: 1.5, // 흉년 시 매입가 상승 배수
  surgeMultiplier: 2.0, // 수요 폭등 시 판매가 배수
}

// ── 8) 지도 학습용: 전국 지역 도형(SVG) + 설명 ──────
// path 는 360×480 좌표계(viewBox)에서의 지역 모양입니다.
// hasProducts=false 인 수도권은 이 게임에서 특산물을 다루지 않습니다.
// (지리를 정확히 보여주려고 지도에는 포함했어요)
export const MAP_VIEWBOX = '0 0 360 480'

export const MAP_REGIONS = [
  {
    key: '수도권',
    label: '수도권',
    color: '#B0BEC5',
    hasProducts: false,
    path: 'M118,72 L172,60 L196,92 L184,132 L128,140 L104,108 Z',
    labelX: 148,
    labelY: 104,
    desc: '서울·경기 지역이에요. 이 게임에서는 특산물을 다루지 않아요. 🙂',
  },
  {
    key: '강원',
    label: '강원',
    color: '#42A5F5',
    hasProducts: true,
    path: 'M200,58 L286,52 L308,104 L288,158 L216,150 L190,120 Z',
    labelX: 248,
    labelY: 104,
    desc: '높은 산과 시원한 바다가 있어요. 감자와 황태가 유명해요.',
  },
  {
    key: '충청',
    label: '충청',
    color: '#66BB6A',
    hasProducts: true,
    path: 'M104,148 L188,146 L206,180 L196,228 L126,236 L94,196 Z',
    labelX: 146,
    labelY: 192,
    desc: '넓은 들판이 있어요. 인삼과 딸기가 유명해요.',
  },
  {
    key: '경상',
    label: '경상',
    color: '#FF7043',
    hasProducts: true,
    path: 'M212,162 L296,172 L302,250 L266,330 L214,322 L202,250 Z',
    labelX: 252,
    labelY: 240,
    desc: '동해 바다와 큰 강이 있어요. 사과와 대게가 유명해요.',
  },
  {
    key: '전라',
    label: '전라',
    color: '#FFCA28',
    hasProducts: true,
    path: 'M98,242 L194,240 L204,286 L182,344 L120,346 L90,298 Z',
    labelX: 144,
    labelY: 292,
    desc: '기름진 평야와 바다가 있어요. 굴비와 김이 유명해요.',
  },
  {
    key: '제주',
    label: '제주',
    color: '#AB47BC',
    hasProducts: true,
    path: 'M122,414 L176,408 L188,438 L152,456 L118,446 Z',
    labelX: 152,
    labelY: 434,
    desc: '따뜻한 남쪽 섬이에요. 감귤과 흑돼지가 유명해요.',
  },
]

// 지역 이름 → 지도 지역 정보 (빠른 조회용)
export const MAP_REGION_BY_KEY = MAP_REGIONS.reduce((acc, r) => {
  acc[r.key] = r
  return acc
}, {})
