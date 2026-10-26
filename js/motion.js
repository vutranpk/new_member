/**
 * Welcome Studio — Motion Design with GSAP
 * Orchestrates page intro, fluid screen transitions, micro-interactions,
 * and ambient animations with full reduced-motion accessibility.
 */

const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const getGsap = () => window.gsap;

export const motion = {
  /**
   * Màn hình mở đầu (Intro gate): Kicker, Tiêu đề, Ô tìm kiếm và Bản xem trước trượt vào êm ái
   */
  animateGateIntro() {
    const gsap = getGsap();
    if (!gsap || prefersReduced()) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo('.gate__kicker', { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.5 })
      .fromTo('.gate__title', { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.35')
      .fromTo('.search', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
      .fromTo('.list-head', { opacity: 0 }, { opacity: 1, duration: 0.4 }, '-=0.2')
      .fromTo('.gate__stage', { opacity: 0, scale: 0.94, y: 24 }, { opacity: 1, scale: 1, y: 0, duration: 0.8 }, 0.1);
  },

  /**
   * Danh sách công ty: Từng hàng trượt vào lần lượt (stagger)
   */
  animateListRows(container = '#company-list') {
    const gsap = getGsap();
    if (!gsap || prefersReduced()) return;

    const rows = document.querySelectorAll(`${container} .company-row`);
    if (!rows.length) return;

    gsap.fromTo(rows,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.4, stagger: 0.045, ease: 'power2.out', clearProps: 'transform,opacity' }
    );
  },

  /**
   * Xem trước poster bên phải khi di chuột / chọn công ty
   */
  animateCompanyPreview(stage = '.gate__stage') {
    const gsap = getGsap();
    if (!gsap || prefersReduced()) return;

    const stageEl = document.querySelector(`${stage} .poster`);
    if (!stageEl) return;

    gsap.killTweensOf(stageEl);
    gsap.fromTo(stageEl,
      { scale: 0.985 },
      { scale: 1, duration: 0.35, ease: 'power2.out', clearProps: 'transform' }
    );
  },

  /**
   * Chuyển màn hình từ Gate -> Studio mượt mà chuẩn điện ảnh
   */
  animateTransitionToStudio({ onMidpoint, onComplete }) {
    const gsap = getGsap();
    if (!gsap || prefersReduced()) {
      onMidpoint?.();
      onComplete?.();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(['#studio .topbar', '#studio .editor', '#studio .section', '#poster-box', '.gate__panel', '.gate__stage'], { clearProps: 'all' });
        onComplete?.();
      }
    });

    // Phase 1: Gate thu nhỏ và trượt biến mất
    tl.to('.gate__panel', { x: -35, opacity: 0, duration: 0.28, ease: 'power2.in' })
      .to('.gate__stage', { scale: 0.94, opacity: 0, duration: 0.28, ease: 'power2.in' }, '<')
      .add(() => {
        onMidpoint?.();
      })
      // Phase 2: Studio xuất hiện đồng bộ
      .fromTo('#studio .topbar', { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' })
      .fromTo('#studio .editor', { x: -35, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, '-=0.35')
      .fromTo('#studio .section', { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, stagger: 0.07, ease: 'power2.out' }, '-=0.35')
      .fromTo('#poster-box', { scale: 0.92, opacity: 0, y: 22 }, { scale: 1, opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }, '-=0.45');
  },

  /**
   * Chuyển màn hình từ Studio -> Gate (Khi bấm đổi công ty)
   */
  animateTransitionToGate({ onMidpoint, onComplete }) {
    const gsap = getGsap();
    if (!gsap || prefersReduced()) {
      onMidpoint?.();
      onComplete?.();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(['#studio', '.gate__panel', '.gate__stage'], { clearProps: 'all' });
        onComplete?.();
      }
    });

    // Phase 1: Studio mờ dần
    tl.to('#studio', { opacity: 0, y: 16, duration: 0.25, ease: 'power2.in' })
      .add(() => {
        onMidpoint?.();
      })
      // Phase 2: Gate mở lại nhẹ nhàng
      .fromTo('.gate__panel', { x: -28, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: 'power3.out' })
      .fromTo('.gate__stage', { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' }, '-=0.35')
      .fromTo('.company-row', { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, stagger: 0.035, ease: 'power2.out' }, '-=0.3');
  },

  /**
   * Ngôi sao trang trí lấp lánh nhẹ nhàng (Ambient floating sparks)
   */
  animateSparks(container = document) {
    const gsap = getGsap();
    if (!gsap || prefersReduced()) return;

    const sparks = container.querySelectorAll('.poster__spark');
    sparks.forEach((s, idx) => {
      gsap.to(s, {
        y: idx % 2 === 0 ? -4 : 4,
        rotation: idx % 2 === 0 ? 6 : -6,
        duration: 2.8 + idx * 0.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: idx * 0.35,
      });
    });
  },

  /**
   * Hiệu ứng pop nhẹ khi đổi danh xưng (Anh / Chị)
   */
  animateSaluteChange(el) {
    const gsap = getGsap();
    if (!gsap || prefersReduced() || !el) return;

    gsap.fromTo(el,
      { scale: 0.88, opacity: 0.2, y: -4 },
      { scale: 1, opacity: 1, y: 0, duration: 0.28, ease: 'back.out(2)' }
    );
  },

  /**
   * Hiệu ứng khi nạp ảnh chân dung thành công
   */
  animatePhotoIn(frameEl) {
    const gsap = getGsap();
    if (!gsap || prefersReduced() || !frameEl) return;

    gsap.fromTo(frameEl,
      { scale: 0.92, filter: 'brightness(1.15)' },
      { scale: 1, filter: 'brightness(1)', duration: 0.45, ease: 'back.out(1.5)', clearProps: 'filter' }
    );
  },

  /**
   * Toast notification bật lên mềm mại
   */
  showToast(toastEl) {
    const gsap = getGsap();
    if (!gsap || prefersReduced() || !toastEl) {
      toastEl.hidden = false;
      return;
    }
    toastEl.hidden = false;
    gsap.fromTo(toastEl,
      { xPercent: -50, y: 25, opacity: 0, scale: 0.94 },
      { xPercent: -50, y: 0, opacity: 1, scale: 1, duration: 0.38, ease: 'back.out(1.6)' }
    );
  },

  hideToast(toastEl, onHidden) {
    const gsap = getGsap();
    if (!gsap || prefersReduced() || !toastEl) {
      toastEl.hidden = true;
      onHidden?.();
      return;
    }
    gsap.to(toastEl, {
      xPercent: -50,
      y: 15,
      opacity: 0,
      scale: 0.96,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        toastEl.hidden = true;
        onHidden?.();
      }
    });
  }
};
