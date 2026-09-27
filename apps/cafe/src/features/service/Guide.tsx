import { CUP_SUPPLY } from '../inventory/cups'

export default function ServiceGuide() {
  return (
    <section className="border-t border-line py-4 first:border-0 first:pt-0">
      <h3 className="font-semibold">매장·포장과 컵</h3>
      <p className="mt-3 text-muted">
        매장은 HOT 머그·ICED 유리잔, 포장은 HOT 종이컵·ICED 일회용 컵을 사용합니다. 주문의 매장·포장, 온도, 사이즈를
        보고 보관대에서 컵을 고릅니다. 틀리면 컵은 제자리에 두고 다른 부분을 알려줍니다. 일회용 컵은 백룸 창고에서 최대
        {CUP_SUPPLY.refill}개를 집어 바 컵 보관대에 E로 보충합니다. 포장 손님은 소모품을 챙긴 뒤 바로 퇴장합니다. 매장
        손님은 테이블을 이용한 뒤 컵 반납대에 반납하거나 테이블에 남깁니다.
      </p>
      <p className="mt-2 text-muted">
        세척 순서는 사이즈와 관계없이 같습니다. 씻은 컵을 보관대에 돌려놓으면 원래 사이즈의 재고로 돌아갑니다.
      </p>
      <p className="mt-2 text-muted">
        ICED 컵에는 하단·중간·상단 기준선이 있습니다. 금색 선은 현재 단계의 목표 높이이며 HOT 컵에도 표시됩니다.
      </p>
    </section>
  )
}
