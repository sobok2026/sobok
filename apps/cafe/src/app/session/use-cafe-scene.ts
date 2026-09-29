import { type RefObject, useEffect, useRef, useState } from 'react'
import type { CafeStore } from '../../simulation/store'
import type { CafeScene, SceneOptions } from '../../world/scene'

export function useCafeScene(store: CafeStore, host: RefObject<HTMLDivElement | null>, options: SceneOptions) {
  const scene = useRef<CafeScene | null>(null)
  const [sceneReady, setSceneReady] = useState(false)
  const [graphicsError, setGraphicsError] = useState('')
  // Callbacks read mutable interaction flags, while the renderer stays alive for this store.
  const latest = useRef(options)

  latest.current = options

  useEffect(() => {
    let cancelled = false
    let current: CafeScene | null = null
    setSceneReady(false)
    setGraphicsError('')
    void import('../../world/scene')
      .then(async ({ createCafeScene }) => {
        if (cancelled || !host.current) {
          return
        }
        try {
          current = createCafeScene(host.current, {
            getState: store.getSnapshot,
            mouseSensitivity: () => latest.current.mouseSensitivity(),
            touchControls: () => latest.current.touchControls(),
            isRunning: () => latest.current.isRunning(),
            canMove: () => latest.current.canMove(),
            activeStation: () => latest.current.activeStation(),
            onTarget: (id, blocked) => latest.current.onTarget(id, blocked),
            onGuideSide: (side) => latest.current.onGuideSide(side),
            onInteract: (id) => latest.current.onInteract(id),
            onUseStart: (id) => latest.current.onUseStart(id),
            onUseEnd: () => latest.current.onUseEnd(),
            onTool: (id) => latest.current.onTool(id),
            onConfirm: (id) => latest.current.onConfirm(id),
            onMouseMode: (mode) => latest.current.onMouseMode(mode),
            onUnlock: () => latest.current.onUnlock(),
            onError: (message) => {
              if (cancelled) return
              current?.dispose()
              scene.current = null
              current = null
              setSceneReady(false)
              setGraphicsError(message)
              latest.current.onError(message)
            },
          })
          scene.current = current
          await current.ready
          if (cancelled || !current) return
          setSceneReady(true)
        } catch {
          if (cancelled) return
          current?.dispose()
          scene.current = null
          current = null
          setGraphicsError('3D 화면을 열지 못했어요. WebGL 2를 지원하는 브라우저와 그래픽 가속 설정을 확인해주세요.')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGraphicsError('게임 화면을 불러오지 못했어요. 새로고침해주세요.')
        }
      })

    return () => {
      cancelled = true
      store.stopActiveInput()
      current?.dispose()
      if (scene.current === current) scene.current = null
    }
  }, [store, host])

  return { scene, sceneReady, graphicsError }
}
