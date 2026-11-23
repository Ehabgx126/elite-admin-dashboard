/* =========================================
   قالب إيليت — Elite Admin Dashboard
   الملف: js/main.js
   الوظائف: الوضع الليلي، القائمة الجانبية،
   العدادات، رسوم Chart.js، البحث في الجدول
   ========================================= */

(function () {
  'use strict';

  /* ===== 1) الوضع الليلي مع الحفظ في localStorage ===== */
  var themeToggle = document.getElementById('themeToggle');
  var savedTheme = localStorage.getItem('elite-theme');

  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  themeToggle.addEventListener('click', function () {
    var html = document.documentElement;
    var isDark = html.getAttribute('data-theme') === 'dark';
    if (isDark) {
      html.removeAttribute('data-theme');
      localStorage.setItem('elite-theme', 'light');
    } else {
      html.setAttribute('data-theme', 'dark');
      localStorage.setItem('elite-theme', 'dark');
    }
    // إعادة رسم الرسوم بألوان الوضع الحالي
    refreshChartTheme();
  });

  /* ===== 2) القائمة الجانبية في الجوال ===== */
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebarOverlay');
  var toggle = document.getElementById('sidebarToggle');

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  }

  toggle.addEventListener('click', function () {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  });
  overlay.addEventListener('click', closeSidebar);

  /* ===== 3) عدّادات البطاقات المتحركة ===== */
  var statValues = document.querySelectorAll('.stat-value');
  var countersObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var target = parseFloat(el.getAttribute('data-target'));
      var decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
      var duration = 1300;
      var start = null;

      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = eased * target;
        el.textContent = current.toLocaleString('ar-EG', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).replace(/[٠-٩]/g, function (d) {
          return '٠١٢٣٤٥٦٧٨٩'.indexOf(d);
        });
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      countersObserver.unobserve(el);
    });
  }, { threshold: 0.4 });

  statValues.forEach(function (el) { countersObserver.observe(el); });

  /* ===== 4) رسوم Chart.js ===== */
  var isDarkMode = function () {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  };

  var revenueChart = null;
  var categoryChart = null;

  function chartColors() {
    var dark = isDarkMode();
    return {
      grid: dark ? 'rgba(255,255,255,0.08)' : 'rgba(31,36,48,0.08)',
      ticks: dark ? '#9aa1b5' : '#6b7280'
    };
  }

  function buildCharts() {
    var colors = chartColors();

    // رسم المبيعات الأسبوعية
    var revCtx = document.getElementById('revenueChart').getContext('2d');
    revenueChart = new Chart(revCtx, {
      type: 'line',
      data: {
        labels: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
        datasets: [
          {
            label: 'هذا الأسبوع',
            data: [12400, 18200, 15600, 21400, 19800, 25300, 22100],
            borderColor: '#4f6ef7',
            backgroundColor: 'rgba(79, 110, 247, 0.12)',
            fill: true,
            tension: 0.42,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: '#4f6ef7'
          },
          {
            label: 'الأسبوع السابق',
            data: [9800, 14200, 13100, 16800, 15400, 19600, 17800],
            borderColor: '#8b5cf6',
            borderDash: [6, 6],
            fill: false,
            tension: 0.42,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: colors.ticks, usePointStyle: true, pointStyle: 'circle', padding: 18 }
          },
          tooltip: { padding: 12, cornerRadius: 10 }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: colors.ticks } },
          y: {
            grid: { color: colors.grid },
            ticks: { color: colors.ticks, callback: function (v) { return (v / 1000) + 'k'; } }
          }
        }
      }
    });

    // رسم توزيع الفئات
    var catCtx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(catCtx, {
      type: 'doughnut',
      data: {
        labels: ['اشتراكات', 'حزم متقدمة', 'باقات أساسية', 'إضافات'],
        datasets: [{
          data: [42, 26, 21, 11],
          backgroundColor: ['#4f6ef7', '#8b5cf6', '#22c55e', '#f59e0b'],
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: colors.ticks, usePointStyle: true, pointStyle: 'circle', padding: 16 }
          },
          tooltip: { padding: 12, cornerRadius: 10, callbacks: {
            label: function (ctx) { return ctx.label + ': ' + ctx.parsed + '%'; }
          }}
        }
      }
    });
  }

  function refreshChartTheme() {
    var colors = chartColors();
    [revenueChart, categoryChart].forEach(function (chart) {
      if (!chart) return;
      var ticksOpts = chart.options.scales
        ? (chart.options.scales.x || chart.options.scales.y)
        : null;
      // تحديث ألوان النصوص والشبكة ثم إعادة الرسم
      chart.options.plugins.legend.labels.color = colors.ticks;
      if (chart.options.scales && chart.options.scales.x) {
        chart.options.scales.x.ticks.color = colors.ticks;
      }
      if (chart.options.scales && chart.options.scales.y) {
        chart.options.scales.y.ticks.color = colors.ticks;
        chart.options.scales.y.grid.color = colors.grid;
      }
      chart.update();
    });
  }

  if (typeof Chart !== 'undefined') {
    buildCharts();
  }

  /* ===== 5) البحث الفوري في جدول الطلبات ===== */
  var searchInput = document.getElementById('searchInput');
  var tableRows = document.querySelectorAll('#ordersTable tbody tr');

  searchInput.addEventListener('input', function () {
    var q = this.value.trim().toLowerCase();
    tableRows.forEach(function (row) {
      var text = row.textContent.toLowerCase();
      row.style.display = text.indexOf(q) !== -1 ? '' : 'none';
    });
  });

})();
