/**
 * Modern Portfolio Animation
 * Updated to use GSAP v3 and modern JavaScript
 */
{
  const MathUtils = {
    lineEq: (y2, y1, x2, x1, currentVal) => {
      const m = (y2 - y1) / (x2 - x1);
      const b = y1 - m * x1;
      return m * currentVal + b;
    },
    lerp: (a, b, n) => (1 - n) * a + n * b,
    getRandomFloat: (min, max) =>
      (Math.random() * (max - min) + min).toFixed(2),
  };

  const body = document.body;
  const docEl = document.documentElement;

  let winsize;
  const calcWinsize = () =>
    (winsize = { width: window.innerWidth, height: window.innerHeight });
  calcWinsize();
  window.addEventListener("resize", calcWinsize);

  // Modern event handling for mouse position
  const getMousePos = (ev) => ({
    x: ev.clientX,
    y: ev.clientY
  });

  let mousepos = { x: winsize.width / 2, y: winsize.height / 2 };
  window.addEventListener("mousemove", (ev) => (mousepos = getMousePos(ev)));

  let activeTilt = {
    columns: true,
    letters: true,
  };


  // Custom cursor with modern GSAP
  class Cursor {
    constructor(el) {
      this.DOM = { el: el };
      this.DOM.circle = this.DOM.el.querySelector(".cursor__inner--circle");
      this.bounds = this.DOM.circle.getBoundingClientRect();
      this.lastMousePos = { x: 0, y: 0 };
      this.scale = 1;
      this.lastScale = 1;
      this.lastY = 0;
      this.render();
    }

    render() {
      this.lastMousePos.x = MathUtils.lerp(
        this.lastMousePos.x,
        mousepos.x - this.bounds.width / 2,
        0.15
      );
      this.lastMousePos.y = MathUtils.lerp(
        this.lastMousePos.y,
        mousepos.y - this.bounds.height / 2,
        0.15
      );
      this.direction = this.lastY - mousepos.y > 0 ? "up" : "down";
      this.lastScale = MathUtils.lerp(this.lastScale, this.scale, 0.15);
      
      gsap.set(this.DOM.circle, {
        x: this.lastMousePos.x,
        y: this.lastMousePos.y,
        scale: this.lastScale
      });
      
      this.lastY = mousepos.y;
      requestAnimationFrame(() => this.render());
    }

    enter() {
      this.scale = 1.5;
    }

    leave() {
      this.scale = 1;
    }

    click() {
      this.lastScale = 0.4;
    }
  }

  // Column animation with modern GSAP
  class Column {
    constructor(el) {
      this.DOM = { el: el };
      const rect = this.DOM.el.getBoundingClientRect();
      this.height = rect.height;
      this.isBottom = this.DOM.el.classList.contains("column--bottom");
      this.tilt();
    }

    tilt() {
      let translationVals = { tx: 0, ty: 0 };
      const randX = MathUtils.getRandomFloat(5, 20);
      const rY1 = this.isBottom
        ? MathUtils.getRandomFloat(10, 30)
        : MathUtils.getRandomFloat(30, 80);
      const rY2 = this.isBottom
        ? MathUtils.getRandomFloat(30, 80)
        : MathUtils.getRandomFloat(10, 30);

      const render = () => {
        if (activeTilt.columns) {
          translationVals.tx = MathUtils.lerp(
            translationVals.tx,
            MathUtils.lineEq(-randX, randX, winsize.width, 0, mousepos.x),
            0.03
          );
          translationVals.ty = MathUtils.lerp(
            translationVals.ty,
            MathUtils.lineEq(
              this.isBottom ? -rY1 : rY2,
              this.isBottom ? rY2 : -rY1,
              winsize.height,
              0,
              mousepos.y
            ),
            0.03
          );
          
          gsap.set(this.DOM.el, {
            x: translationVals.tx,
            y: translationVals.ty,
            rotation: 0.01,
          });
        } else {
          translationVals = { tx: 0, ty: 0 };
        }
        requestAnimationFrame(render);
      };

      requestAnimationFrame(render);
    }
  }

  class ContentItem {
    constructor(el) {
      this.DOM = { el: el };
      this.DOM.title = this.DOM.el.querySelector(".item__content-title");
      
      // Create spans out of every letter using charming
      charming(this.DOM.title);
      this.DOM.titleLetters = [...this.DOM.title.querySelectorAll("span")];
      this.titleLettersTotal = this.DOM.titleLetters.length;

      this.DOM.backCtrl = this.DOM.el.querySelector(".item__content-back");
      this.initEvents();
    }

    initEvents() {
      this.DOM.backCtrl.addEventListener("click", (ev) => {
        ev.preventDefault();
        menu.closeItem();
      });
    }

    setCurrent() {
      this.DOM.el.classList.add("item--current");
    }

    resetCurrent() {
      this.DOM.el.classList.remove("item--current");
    }
  }

  // Menu Item with modern animations
  class MenuItem {
    constructor(el) {
      this.DOM = { el: el };

      // Create spans out of every letter using charming
      charming(this.DOM.el);
      this.DOM.letters = [...this.DOM.el.querySelectorAll("span")];
      this.lettersTotal = this.DOM.letters.length;

      // Total number of letters that move when hovering and moving the mouse
      this.totalRandomLetters = 3;
      this.totalRandomLetters =
        this.totalRandomLetters <= this.lettersTotal
          ? this.totalRandomLetters
          : this.lettersTotal;
      
      this.lettersTranslations = Array.from(
        { length: this.totalRandomLetters },
        () => {
          const tr = MathUtils.getRandomFloat(10, 50);
          return [-tr, tr];
        }
      );
      this.lettersRotations = Array.from(
        { length: this.totalRandomLetters },
        () => {
          const rr = MathUtils.getRandomFloat(0, 6);
          return [-rr, rr];
        }
      );

      this.initEvents();
    }

    initEvents() {
      this.mouseenterFn = () => {
        const shuffled = [...this.DOM.letters].sort(() => 0.5 - Math.random());
        this.DOM.randLetters = shuffled.slice(0, this.totalRandomLetters);
      };
      
      this.mousemoveFn = (ev) => requestAnimationFrame(() => this.tilt(ev));
      this.mouseleaveFn = () => this.resetTilt();
      
      this.DOM.el.addEventListener("mouseenter", this.mouseenterFn);
      this.DOM.el.addEventListener("mousemove", this.mousemoveFn);
      this.DOM.el.addEventListener("mouseleave", this.mouseleaveFn);
    }

    tilt(ev) {
      if (!activeTilt.letters || !this.DOM.randLetters) return;
      
      const bounds = this.DOM.el.getBoundingClientRect();
      const relmousepos = {
        x: mousepos.x - bounds.left,
        y: mousepos.y - bounds.top,
      };

      this.DOM.randLetters.forEach((letter, index) => {
        gsap.to(letter, {
          duration: 3,
          ease: "expo.out",
          y: MathUtils.lineEq(
            this.lettersTranslations[index][1],
            this.lettersTranslations[index][0],
            bounds.height,
            0,
            relmousepos.y
          ),
          rotation: MathUtils.lineEq(
            this.lettersRotations[index][1],
            this.lettersRotations[index][0],
            bounds.height,
            0,
            relmousepos.y
          ),
          overwrite: "auto"
        });
      });
    }

    resetTilt() {
      if (!activeTilt.letters || !this.DOM.randLetters) return;
      
      const tl = gsap.timeline();
      
      tl.to(this.DOM.randLetters, {
        duration: 0.2,
        ease: "quad.out",
        y: cursor.direction === "up" ? "-80%" : "80%",
        rotation: cursor.direction === "up" ? -10 : 10,
        opacity: 0,
        overwrite: true
      })
      .to(this.DOM.randLetters, {
        duration: MathUtils.getRandomFloat(0.5, 0.7),
        ease: "elastic.out(1, 0.4)",
        y: "0%",
        rotation: 0,
        opacity: 1,
        stagger: 0.02,
        overwrite: false
      }, 0.2);
    }
  }

  class Menu {
    constructor(el) {
      this.DOM = { el: el };
      this.DOM.items = document.querySelectorAll(".menu > .menu__item");
      this.menuItems = Array.from(this.DOM.items, (item) => new MenuItem(item));
      this.initEvents();
    }

    initEvents() {
      this.menuItems.forEach(menuItem => {
        menuItem.DOM.el.addEventListener("click", () =>
          this.openItem(menuItem)
        );
      });
    }

    openItem(menuItem) {
      if (this.isAnimating) return;
      this.isAnimating = true;

      this.currentItem = this.menuItems.indexOf(menuItem);
      const contentItem = contentItems[this.currentItem];
      contentItem.setCurrent();

      activeTilt.columns = false;
      activeTilt.letters = false;

      const duration = 1.2;
      const ease = "power4.out";

      const tl = gsap.timeline({
        onComplete: () => (this.isAnimating = false),
      });

      // Animate columns out
      tl.to(columnsElems, {
        duration: duration,
        ease: ease,
        y: (i, target) => {
          const column = columns[i];
          return target.classList.contains("column--bottom")
            ? column.height + winsize.height * 0.2
            : -1 * column.height - winsize.height * 0.2;
        },
        opacity: 0,
        stagger: 0,
      }, 0)

      // Animate columns wrap
      .to(columnsWrap, {
        duration: duration,
        ease: ease,
        rotation: -2,
      }, 0)

      // Animate menu items out
      .to(menuItem.DOM.letters, {
        duration: duration * 0.7,
        ease: ease,
        y: (i) => i % 2 == 0 
          ? MathUtils.getRandomFloat(-250, -150)
          : MathUtils.getRandomFloat(150, 250),
        rotation: `+=${MathUtils.getRandomFloat(0, 20)}`,
        opacity: 0,
        stagger: -0.01,
      }, 0)

      .to(this.menuItems
        .filter((item) => item != menuItem)
        .map((t) => t.DOM.el), {
        duration: duration * 0.5,
        ease: ease,
        opacity: 0,
      }, 0)

      // Content reveal effect
      .to(content.first, {
        duration: duration * 0.8,
        ease: "expo.out",
        y: "100%",
      }, duration)

      .to(contentMove, {
        duration: duration * 0.8,
        ease: "expo.out",
        y: "-100%",
      }, duration)

      // Animate content title
      .set(contentItem.DOM.titleLetters, {
        opacity: 0,
        y: (i) => i % 2 == 0 
          ? MathUtils.getRandomFloat(-35, -15)
          : MathUtils.getRandomFloat(15, 35),
        rotation: MathUtils.getRandomFloat(-20, 0),
      }, duration)

      .to(contentItem.DOM.titleLetters, {
        duration: duration,
        ease: "expo.out",
        y: 0,
        rotation: 0,
        opacity: 1,
        stagger: -0.01,
      }, duration);
    }

    closeItem() {
      if (this.isAnimating) return;
      this.isAnimating = true;

      const contentItem = contentItems[this.currentItem];
      const duration = 1;
      const ease = "sine.out";

      const tl = gsap.timeline({
        onComplete: () => {
          activeTilt.columns = true;
          activeTilt.letters = true;
          this.isAnimating = false;
        },
      });

      tl.to(contentItem.DOM.titleLetters, {
        duration: duration * 0.6,
        ease: "power4.out",
        y: (i) => i % 2 == 0 
          ? MathUtils.getRandomFloat(-35, -15)
          : MathUtils.getRandomFloat(15, 35),
        rotation: MathUtils.getRandomFloat(-20, 0),
        opacity: 0,
        stagger: 0.01,
      }, 0)

      .to([content.first, contentMove], {
        duration: duration * 0.6,
        ease: "power4.out",
        y: "0%",
        onComplete: () => {
          contentItem.resetCurrent();
        },
      }, 0.2)

      .to(columnsElems, {
        duration: duration,
        ease: ease,
        y: 0,
        x: 0,
        opacity: 1,
        stagger: 0.02,
      }, duration * 0.6)

      .to(columnsWrap, {
        duration: duration,
        ease: ease,
        rotation: 0,
      }, duration * 0.6)

      .to(this.menuItems[this.currentItem].DOM.letters, {
        duration: duration * 0.6,
        ease: "quint.out",
        y: 0,
        opacity: 1,
        rotation: 0,
      }, duration)

      .to(this.DOM.items, {
        duration: duration * 0.6,
        ease: ease,
        opacity: 1,
      }, duration);
    }
  }

  // Initialize
  const cursor = new Cursor(document.querySelector(".cursor"));
  
  const content = {
    first: document.querySelector(".content--first"),
    second: document.querySelector(".content--second"),
  };

  const contentItems = Array.from(
    content.second.querySelectorAll(".item"),
    (item) => new ContentItem(item)
  );

  const contentMove = content.first.querySelector(".content__move");
  const columnsWrap = document.querySelector(".columns");
  const columnsElems = columnsWrap.querySelectorAll(".column");
  const columnsTotal = columnsElems.length;
  let columns;

  const menu = new Menu(content.second.querySelector(".menu"));

  // Cursor interactions
  document.querySelectorAll("a").forEach((link) => {
    link.addEventListener("mouseenter", () => cursor.enter());
    link.addEventListener("mouseleave", () => cursor.leave());
  });
  document.addEventListener("click", () => cursor.click());

  // Initialize when images are loaded
  imagesLoaded(
    document.querySelectorAll(".column__img"),
    { background: true },
    () => {
      columns = Array.from(columnsElems, (column) => new Column(column));
      document.body.classList.remove("loading");
    }
  );
}