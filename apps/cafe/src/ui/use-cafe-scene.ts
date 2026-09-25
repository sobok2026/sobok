import { type RefObject, useEffect, useRef, useState } from 'react'
import type { CafeScene, SceneOptions } from '../game/scene'
import type { CafeStore } from '../game/store'

export function useCafeScene(store: CafeStore, host: RefObject<HTMLDivElement | null>, options: SceneOptions) {
  const scene = useRef<CafeScene | null>(null)
  const [sceneReady, setSceneReady] = useState(false)
  const [graphicsError, setGraphicsError] = useState('')
  // Callbacks read mutable interaction flags, while the renderer stays alive for this store.
  const latest = useRef(options)
  latest.current = options
  useEffect(() => {
    let cancelled = false
    void import('../game/scene')
      .then(({ createCafeScene }) => {
        if (cancelled || !host.current) return
        try {
          scene.current = createCafeScene(host.current, {
            getState: store.getSnapshot,
            mouseSensitivity: () => latest.current.mouseSensitivity(),
            isRunning: () => latest.current.isRunning(),
            canMove: () => latest.current.canMove(),
            activeStation: () => latest.current.activeStation(),
            onTarget: (id, blocked) => latest.current.onTarget(id, blocked),
            onInteract: (id) => latest.current.onInteract(id),
            onUseStart: (id) => latest.current.onUseStart(id),
            onUseEnd: () => latest.current.onUseEnd(),
            onTool: (id) => latest.current.onTool(id),
            onConfirm: (id) => latest.current.onConfirm(id),
            onMouseMode: (mode) => latest.current.onMouseMode(mode),
            onUnlock: () => latest.current.onUnlock(),
            onError: (message) => {
              setGraphicsError(message)
              latest.current.onError(message)
            },
          })
          setSceneReady(true)
        } catch {
          setGraphicsError('3D 화면을 열지 못했어요. WebGL 2를 지원하는 브라우저와 그래픽 가속 설정을 확인해주세요.')
        }
      })
      .catch(() => {
        if (!cancelled) setGraphicsError('게임 화면을 불러오지 못했어요. 새로고침해주세요.')
      })
    return () => {
      cancelled = true
      store.stopActiveInput()
      scene.current?.dispose()
      scene.current = null
    }
  }, [store, host])
  return { scene, sceneReady, graphicsError }
}
