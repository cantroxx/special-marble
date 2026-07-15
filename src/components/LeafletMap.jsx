// LeafletMap.jsx — 무료 지도(Leaflet + OpenStreetMap/CARTO 타일)
//  - API 키·비즈앱 등록 필요 없음! 인터넷만 있으면 진짜 지도가 떠요.
//  - KoreaMap(SVG)/KakaoMap 과 같은 props 를 받아 서로 바꿔 쓸 수 있어요.
//  - 각 지역 좌표에 특산물 핀(클릭 가능)을 얹습니다.
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MAP_REGIONS, MAP_CENTER } from '../data.js'

export default function LeafletMap({
  onRegionClick,
  selected = null,
  feedback = null,
  clickableOnlyProducts = false,
  onFail,
}) {
  const boxRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const cbRef = useRef(onRegionClick)
  cbRef.current = onRegionClick // 항상 최신 콜백 사용

  const [ready, setReady] = useState(false)

  // 지도 초기화 (최초 1회)
  useEffect(() => {
    if (!boxRef.current) return
    let map
    try {
      map = L.map(boxRef.current, {
        center: [MAP_CENTER.lat, MAP_CENTER.lng],
        zoom: 7,
        minZoom: 6,
        maxZoom: 12,
        scrollWheelZoom: true,
        attributionControl: true,
      })
      // 무료 지도 타일 (CARTO Voyager — 파스텔·부드러운 톤, 키 불필요)
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          subdomains: 'abcd',
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        },
      ).addTo(map)

      // 우리나라 전체가 보이도록 맞춤
      map.fitBounds([
        [33.1, 125.5],
        [38.7, 129.8],
      ])
      mapRef.current = map
      setReady(true)
      // 컨테이너 크기 반영(탭 전환 등으로 늦게 그려질 때 대비)
      setTimeout(() => map.invalidateSize(), 100)
    } catch (e) {
      onFail && onFail()
    }

    return () => {
      if (map) map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 핀(마커) 그리기/갱신
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    MAP_REGIONS.forEach((r) => {
      if (r.lat == null) return
      const clickable = !clickableOnlyProducts || r.hasProducts

      let bg = r.hasProducts ? r.color : '#90A4AE'
      if (selected === r.key) bg = r.color
      if (feedback && feedback.region === r.key) {
        bg = feedback.correct ? '#2e7d32' : '#c62828'
      }

      const html =
        `<div class="region-pin${clickable ? '' : ' disabled'}" style="background:${bg}">` +
        `<span class="rp-emoji">${r.emoji || '📍'}</span>` +
        `<span class="rp-label">${r.label}</span>` +
        `</div>`

      const icon = L.divIcon({
        className: 'region-pin-wrap', // Leaflet 기본 흰 네모 스타일 제거용
        html,
        iconSize: [66, 46],
        iconAnchor: [33, 46],
      })

      const marker = L.marker([r.lat, r.lng], {
        icon,
        interactive: clickable,
        zIndexOffset: selected === r.key ? 1000 : 0,
      }).addTo(map)

      if (clickable) {
        marker.on('click', () => cbRef.current && cbRef.current(r.key))
      }
      markersRef.current.push(marker)
    })
  }, [ready, selected, feedback, clickableOnlyProducts])

  return <div ref={boxRef} className="leaflet-box" />
}
