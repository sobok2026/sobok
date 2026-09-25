export default function ServiceGuide() {
  return (
    <details className="border-t border-line py-4">
      <summary className="font-medium">매장·포장과 컵</summary>
      <p className="mt-3 text-muted">
        매장은 HOT 머그·ICED 유리잔, 포장은 HOT 종이컵·ICED 일회용 컵을 사용합니다. 주문 사이즈에 맞는 컵을 보관대에서
        집고, 종류·사이즈별로 재고를 보충합니다. 포장 손님은 소모품을 챙긴 뒤 바로 퇴장합니다. 매장 손님은 테이블을
        이용한 뒤 컵을 반납하거나 테이블에 남깁니다.
      </p>
      <p className="mt-2 text-muted">
        세척 순서는 사이즈와 관계없이 같습니다. 씻은 컵을 보관대에 돌려놓으면 원래 사이즈의 재고로 돌아갑니다.
      </p>
      <p className="mt-2 text-muted">
        ICED 컵에는 하단·중간·상단 기준선이 있습니다. 금색 선은 현재 단계의 목표 높이이며 HOT 컵에도 표시됩니다.
      </p>
    </details>
  )
}
