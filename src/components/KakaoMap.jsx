// KakaoMap.jsx — 진짜 카카오맵 위에 특산물 핀을 얹은 지도
//  - KoreaMap(SVG)과 같은 props 를 받아서 서로 바꿔 쓸 수 있어요.
//  - 카카오 SDK 로드 실패(키 없음/인터넷 없음/도메인 미등록) 시 onFail() 호출
//    → 부모(MapLearn)가 SVG 지도로 자동 대체합니다.
//
//  카카오 키는 .env 의 VITE_KAKAO_MAP_KEY 로 넣으세요.
//  (없으면 아래 기본 키로 시도하지만, 도메인 등록이 안 돼 있으면 안 뜰 수 있어요)
import { useEffect, useRef, useState } from 'react'
import { MAP_REGIONS, MAP_CENTER } from '../data.js'

const KAKAO_KEY =
  import.meta.env.VITE_KAKAO_MAP_KEY || 'ba24a49e2e00f2a390b41f4c734d9f30'

// SDK 는 앱 전체에서 한 번만 로드 (Promise 캐시)
let sdkPromise = null
function loadKakao() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.kakao && window.kakao.maps) return Promise.resolve(window.kakao)
  if (sdkPromise) return sdkPromise

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`
    script.async = true
    script.onload = () => {
      try {
        window.kakao.maps.load(() => resolve(window.kakao))
      } catch (e) {
        reject(e)
      }
    }
    script.onerror = () => reject(new Error('카카오 SDK 로드 실패'))
    document.head.appendChild(script)
  })
  return sdkPromise
}

export default function KakaoMap({
  onRegionClick,
  selected = null,
  feedback = null,
  clickableOnlyProducts = false,
  onFail,
}) {
  const boxRef = useRef(null)
  const ctxRef = useRef(null) // { kakao, map }
  const overlaysRef = useRef([])
  const cbRef = useRef(onRegionClick)
  cbRef.current = onRegionClick // 항상 최신 콜백 사용(오래된 클로저 방지)

  const [status, setStatus] = useState('loading') // loading | ready | fail

  // 지도 초기화 (최초 1회)
  useEffect(() => {
    let cancelled = false
    // 6초 안에 준비 안 되면 실패로 간주(도메인 미등록 등)
    const timer = setTimeout(() => {
      if (!cancelled && status === 'loading') {
        setStatus('fail')
        onFail && onFail()
      }
    }, 6000)

    loadKakao()
      .then((kakao) => {
        if (cancelled || !boxRef.current) return
        const map = new kakao.maps.Map(boxRef.current, {
          center: new kakao.maps.LatLng(MAP_CENTER.lat, MAP_CENTER.lng),
          level: MAP_CENTER.level,
        })
        ctxRef.current = { kakao, map }
        clearTimeout(timer)
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        clearTimeout(timer)
        setStatus('fail')
        onFail && onFail()
      })

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 핀(커스텀 오버레이) 그리기/갱신
  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx || status !== 'ready') return
    const { kakao, map } = ctx

    overlaysRef.current.forEach((o) => o.setMap(null))
    overlaysRef.current = []

    MAP_REGIONS.forEach((r) => {
      if (r.lat == null) return
      const clickable = !clickableOnlyProducts || r.hasProducts

      let bg = r.hasProducts ? r.color : '#90A4AE'
      if (selected === r.key) bg = r.color
      if (feedback && feedback.region === r.key) {
        bg = feedback.correct ? '#2e7d32' : '#c62828'
      }

      const el = document.createElement('div')
      el.className = 'kakao-pin' + (clickable ? '' : ' disabled')
      el.style.background = bg
      el.innerHTML =
        `<span class="kp-emoji">${r.emoji || '📍'}</span>` +
        `<span class="kp-label">${r.label}</span>`
      if (clickable) {
        el.onclick = () => cbRef.current && cbRef.current(r.key)
      }

      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(r.lat, r.lng),
        content: el,
        yAnchor: 1,
        zIndex: selected === r.key ? 10 : 1,
      })
      overlay.setMap(map)
      overlaysRef.current.push(overlay)
    })
  }, [status, selected, feedback, clickableOnlyProducts])

  if (status === 'fail') return null // 부모가 SVG 지도로 대체

  return (
    <div className="kakao-wrap">
      <div ref={boxRef} className="kakao-box" />
      {status === 'loading' && <div className="kakao-loading">🗺️ 지도를 불러오는 중…</div>}
    </div>
  )
}
