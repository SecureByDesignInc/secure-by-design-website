(() => {
  const data = window.careerData;
  if (!data) return;
  const stateSelect = document.querySelector("#state-select");
  const occupationSelect = document.querySelector("#occupation-select");
  const dashboard = document.querySelector("#market-dashboard");
  const rankButtons = [...document.querySelectorAll(".leader-toggle button")];
  let rankMode = "pay";

  const money = (value) => value == null ? "Not published" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
  const number = (value) => value == null ? "Not published" : new Intl.NumberFormat("en-US").format(value);
  const decimal = (value, digits = 2) => value == null ? "—" : Number(value).toFixed(digits);
  const setText = (selector, value) => { document.querySelector(selector).textContent = value; };
  const rowsFor = (code) => Object.values(data.states[code]).filter((row) => row.available);
  const ranked = (code, field) => rowsFor(code).filter((row) => row[field] != null).sort((a, b) => b[field] - a[field]);
  const rankOf = (code, abbr, field) => {
    const rows = ranked(code, field); const index = rows.findIndex((row) => row.abbr === abbr);
    return index < 0 ? "Not ranked" : `#${index + 1} of ${rows.length}`;
  };

  Object.values(data.states["15-1244"]).sort((a, b) => a.state.localeCompare(b.state)).forEach((row) => {
    const option = document.createElement("option"); option.value = row.abbr; option.textContent = row.state; stateSelect.append(option);
  });
  Object.entries(data.occupations).forEach(([code, occupation]) => {
    const option = document.createElement("option"); option.value = code; option.textContent = occupation.short; occupationSelect.append(option);
  });
  stateSelect.value = "UT";
  occupationSelect.value = "15-1212";
  setText("#data-period", `${data.period} OEWS`);

  function signal(lq) {
    if (lq == null) return "Estimate unavailable";
    if (lq >= 1.5) return "Highly concentrated market";
    if (lq >= 1.15) return "Above-average concentration";
    if (lq >= .85) return "Near national concentration";
    return "Below-average concentration";
  }

  function renderLeaders() {
    const code = occupationSelect.value;
    const field = rankMode === "pay" ? "a_median" : "loc_quotient";
    const rows = ranked(code, field).slice(0, 5);
    const list = document.querySelector("#leader-list"); list.replaceChildren();
    rows.forEach((row, index) => {
      const li = document.createElement("li");
      const place = document.createElement("span"); place.textContent = String(index + 1).padStart(2, "0");
      const state = document.createElement("span"); state.textContent = row.state;
      const value = document.createElement("b"); value.textContent = rankMode === "pay" ? money(row.a_median) : `${decimal(row.loc_quotient)} LQ`;
      li.append(place, state, value); list.append(li);
    });
  }

  function render() {
    const code = occupationSelect.value; const abbr = stateSelect.value;
    const row = data.states[code][abbr]; const occupation = data.occupations[code]; const national = data.national[code];
    const oldNote = dashboard.querySelector(".unavailable-note"); if (oldNote) oldNote.remove();
    dashboard.classList.toggle("is-unavailable", !row.available);
    setText("#market-family", occupation.family); setText("#market-state", row.state); setText("#market-role", occupation.short);
    setText("#market-titles", `Related titles: ${occupation.titles.join(" · ")}`); setText("#market-signal", signal(row.loc_quotient));
    setText("#metric-median", money(row.a_median)); setText("#metric-employment", number(row.tot_emp)); setText("#metric-density", decimal(row.jobs_1000, 2)); setText("#metric-lq", decimal(row.loc_quotient, 2));
    const delta = row.a_median != null && national.a_median ? Math.round((row.a_median / national.a_median - 1) * 100) : null;
    setText("#metric-median-compare", delta == null ? "State estimate unavailable" : `${Math.abs(delta)}% ${delta >= 0 ? "above" : "below"} U.S. median`);
    const projection = row.projection;
    setText("#projection-period", projection ? `${projection.base_year}–${projection.projection_year} projection` : "Projection unavailable");
    setText("#projection-growth", projection?.percent_change == null ? "—" : `${projection.percent_change > 0 ? "+" : ""}${decimal(projection.percent_change, 1)}%`);
    setText("#annual-openings", projection?.annual_openings == null ? "—" : number(projection.annual_openings));
    setText("#projected-jobs", projection?.projected == null ? "—" : number(projection.projected));
    setText("#real-median", money(row.real_median));
    setText("#rpp-value", row.rpp == null ? "Not published" : decimal(row.rpp, 1));
    setText("#rpp-explainer", row.rpp == null ? "BEA price-level data is unavailable for this selection." : row.rpp > 100 ? `Local prices are estimated ${decimal(row.rpp - 100, 1)}% above the U.S. level. This reduces the median’s relative buying power.` : `Local prices are estimated ${decimal(100 - row.rpp, 1)}% below the U.S. level. This increases the median’s relative buying power.`);
    setText("#wage-p10", money(row.a_pct10)); setText("#wage-p25", money(row.a_pct25)); setText("#wage-median", money(row.a_median)); setText("#wage-p75", money(row.a_pct75)); setText("#wage-p90", money(row.a_pct90));
    setText("#pay-rank", rankOf(code, abbr, "a_median")); setText("#lq-rank", rankOf(code, abbr, "loc_quotient")); setText("#national-median", money(national.a_median)); setText("#national-employment", number(national.tot_emp));
    document.querySelector("#pay-compare-bar").style.width = row.a_median && national.a_median ? `${Math.min(100, row.a_median / national.a_median * 50)}%` : "0%";
    document.querySelector("#lq-compare-bar").style.width = row.loc_quotient ? `${Math.min(100, row.loc_quotient * 50)}%` : "0%";
    document.querySelector("#usajobs-link").href = `https://www.usajobs.gov/Search/Results?k=${encodeURIComponent(occupation.short)}&l=${encodeURIComponent(row.state)}`;
    const stateLmi = document.querySelector("#state-lmi-link");
    stateLmi.href = projection?.state_url || "https://projectionscentral.org/Projections/LongTerm";
    stateLmi.textContent = projection?.state_url ? `${row.state} labor-market office ↗` : "State projections source ↗";
    const metroRows = document.querySelector("#metro-rows"); metroRows.replaceChildren();
    if (row.metros?.length) {
      row.metros.forEach((metro) => {
        const item = document.createElement("div"); item.className = "metro-row"; item.setAttribute("role", "row");
        [metro.name, number(metro.employment), money(metro.median), metro.lq == null ? "—" : `${decimal(metro.lq)} LQ`].forEach((value) => { const cell = document.createElement("span"); cell.setAttribute("role", "cell"); cell.textContent = value; item.append(cell); });
        metroRows.append(item);
      });
    } else {
      const empty = document.createElement("p"); empty.className = "metro-empty"; empty.textContent = "BLS did not publish a metropolitan estimate for this state and occupation."; metroRows.append(empty);
    }
    if (!row.available) {
      const note = document.createElement("p"); note.className = "unavailable-note"; note.textContent = `BLS did not publish a ${data.period} state estimate for ${occupation.short} in ${row.state}. This does not mean no one works in the occupation; the estimate may be unavailable or suppressed.`;
      dashboard.querySelector(".market-result-head").after(note);
    }
    renderLeaders();
  }

  stateSelect.addEventListener("change", render);
  occupationSelect.addEventListener("change", render);
  rankButtons.forEach((button) => button.addEventListener("click", () => {
    rankMode = button.dataset.rank; rankButtons.forEach((item) => item.classList.toggle("active", item === button)); renderLeaders();
  }));
  render();
})();
