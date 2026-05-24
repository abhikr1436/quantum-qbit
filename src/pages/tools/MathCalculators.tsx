import React, { useState, useEffect, useRef } from 'react';
import { Calculator, Binary, RefreshCw, Hash, Copy, Check, Equal, LineChart, Trash2, Plus, Download } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MathCalculatorsProps {
  defaultTab?: 'scientific' | 'base' | 'unit' | 'solver' | 'plotter';
}

export const MathCalculators: React.FC<MathCalculatorsProps> = ({ defaultTab }) => {
  const [activeTab, setActiveTab] = useState<'scientific' | 'base' | 'unit' | 'solver' | 'plotter'>(defaultTab || 'scientific');

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Theme state to re-draw canvas when theme changes
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'dark');
  
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // =========================================================================
  // Scientific Calculator State & Actions
  // =========================================================================
  const [calcDisplay, setCalcDisplay] = useState('');
  const [calcResult, setCalcResult] = useState('');

  const handleCalcKeyPress = (key: string) => {
    if (key === 'C') {
      setCalcDisplay('');
      setCalcResult('');
    } else if (key === '⌫') {
      setCalcDisplay((prev) => prev.slice(0, -1));
    } else if (key === '=') {
      calculateResult();
    } else {
      setCalcDisplay((prev) => prev + key);
    }
  };

  const calculateResult = () => {
    try {
      // Sanitize expression: only allow numbers, math operators, math functions
      let expression = calcDisplay
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/\^/g, '**');

      // Check if expression is empty or invalid character exists
      if (!expression.trim()) return;
      if (/[^0-9.+\-*/%()eMathPIElnsqrt,]/i.test(expression.replace(/Math\.[a-zA-Z]+/g, ''))) {
        throw new Error("Invalid characters");
      }

      // Safe evaluation using Function
      const evalFunc = new Function(`return ${expression}`);
      const res = evalFunc();
      
      if (res === null || res === undefined || isNaN(res)) {
        setCalcResult('Error');
      } else {
        setCalcResult(Number(res.toFixed(8)).toString());
        // Small success vibration/confetti if they compute something neat
        if (calcDisplay.includes('sin') || calcDisplay.includes('cos') || calcDisplay.includes('π')) {
          confetti({ particleCount: 30, spread: 40, colors: ['#00f2fe', '#ffffff'] });
        }
      }
    } catch (e) {
      setCalcResult('Error');
    }
  };

  // =========================================================================
  // Base Converter State & Actions
  // =========================================================================
  const [decVal, setDecVal] = useState('');
  const [binVal, setBinVal] = useState('');
  const [hexVal, setHexVal] = useState('');
  const [octVal, setOctVal] = useState('');

  const handleBaseChange = (value: string, base: 10 | 2 | 16 | 8) => {
    if (!value) {
      setDecVal('');
      setBinVal('');
      setHexVal('');
      setOctVal('');
      return;
    }

    try {
      let decimal: number;
      
      switch (base) {
        case 10:
          if (/[^0-9]/.test(value)) {
            if ((window as any).showToast) (window as any).showToast('Decimal input must contain only digits (0-9).');
            return;
          }
          decimal = parseInt(value, 10);
          if (isNaN(decimal)) return;
          setDecVal(value);
          setBinVal(decimal.toString(2));
          setHexVal(decimal.toString(16).toUpperCase());
          setOctVal(decimal.toString(8));
          break;
        case 2:
          if (/[^0-1]/.test(value)) {
            if ((window as any).showToast) (window as any).showToast('Binary input must contain only 0 and 1.');
            return;
          }
          decimal = parseInt(value, 2);
          setBinVal(value);
          setDecVal(isNaN(decimal) ? '' : decimal.toString(10));
          setHexVal(isNaN(decimal) ? '' : decimal.toString(16).toUpperCase());
          setOctVal(isNaN(decimal) ? '' : decimal.toString(8));
          break;
        case 16:
          if (/[^0-9a-fA-F]/.test(value)) {
            if ((window as any).showToast) (window as any).showToast('Hexadecimal input must contain only 0-9 and A-F.');
            return;
          }
          decimal = parseInt(value, 16);
          setHexVal(value.toUpperCase());
          setDecVal(isNaN(decimal) ? '' : decimal.toString(10));
          setBinVal(isNaN(decimal) ? '' : decimal.toString(2));
          setOctVal(isNaN(decimal) ? '' : decimal.toString(8));
          break;
        case 8:
          if (/[^0-7]/.test(value)) {
            if ((window as any).showToast) (window as any).showToast('Octal input must contain only digits (0-7).');
            return;
          }
          decimal = parseInt(value, 8);
          setOctVal(value);
          setDecVal(isNaN(decimal) ? '' : decimal.toString(10));
          setBinVal(isNaN(decimal) ? '' : decimal.toString(2));
          setHexVal(isNaN(decimal) ? '' : decimal.toString(16).toUpperCase());
          break;
      }
    } catch (e) {
      // Fail silently for incomplete parsing
    }
  };

  // =========================================================================
  // Unit Converter State & Actions
  // =========================================================================
  const [unitCategory, setUnitCategory] = useState<'length' | 'mass' | 'temp'>('length');
  const [convertVal, setConvertVal] = useState('1');
  const [unitFrom, setUnitFrom] = useState('m');
  const [unitTo, setUnitTo] = useState('km');
  const [convertedResult, setConvertedResult] = useState('0.001');

  const unitLists = {
    length: [
      { id: 'm', label: 'Meters (m)' },
      { id: 'km', label: 'Kilometers (km)' },
      { id: 'cm', label: 'Centimeters (cm)' },
      { id: 'mi', label: 'Miles (mi)' },
      { id: 'ft', label: 'Feet (ft)' },
      { id: 'in', label: 'Inches (in)' },
    ],
    mass: [
      { id: 'g', label: 'Grams (g)' },
      { id: 'kg', label: 'Kilograms (kg)' },
      { id: 'lb', label: 'Pounds (lb)' },
      { id: 'oz', label: 'Ounces (oz)' },
    ],
    temp: [
      { id: 'C', label: 'Celsius (°C)' },
      { id: 'F', label: 'Fahrenheit (°F)' },
      { id: 'K', label: 'Kelvin (K)' },
    ],
  };

  // Convert callback
  const runUnitConversion = (val: string, from: string, to: string, category: 'length' | 'mass' | 'temp') => {
    const num = parseFloat(val);
    if (isNaN(num)) {
      setConvertedResult('');
      return;
    }

    let result = 0;

    if (category === 'length') {
      // Standardize to Meters
      let meters = 0;
      switch (from) {
        case 'm': meters = num; break;
        case 'km': meters = num * 1000; break;
        case 'cm': meters = num / 100; break;
        case 'mi': meters = num * 1609.344; break;
        case 'ft': meters = num * 0.3048; break;
        case 'in': meters = num * 0.0254; break;
      }
      // Convert from Meters to target
      switch (to) {
        case 'm': result = meters; break;
        case 'km': result = meters / 1000; break;
        case 'cm': result = meters * 100; break;
        case 'mi': result = meters / 1609.344; break;
        case 'ft': result = meters / 0.3048; break;
        case 'in': result = meters / 0.0254; break;
      }
    } else if (category === 'mass') {
      // Standardize to Grams
      let grams = 0;
      switch (from) {
        case 'g': grams = num; break;
        case 'kg': grams = num * 1000; break;
        case 'lb': grams = num * 453.59237; break;
        case 'oz': grams = num * 28.34952; break;
      }
      // Convert from Grams to target
      switch (to) {
        case 'g': result = grams; break;
        case 'kg': result = grams / 1000; break;
        case 'lb': result = grams / 453.59237; break;
        case 'oz': result = grams / 28.34952; break;
      }
    } else if (category === 'temp') {
      // Standardize to Celsius
      let celsius = 0;
      switch (from) {
        case 'C': celsius = num; break;
        case 'F': celsius = (num - 32) * (5/9); break;
        case 'K': celsius = num - 273.15; break;
      }
      // Convert from Celsius to target
      switch (to) {
        case 'C': result = celsius; break;
        case 'F': result = celsius * (9/5) + 32; break;
        case 'K': result = celsius + 273.15; break;
      }
    }

    setConvertedResult(Number(result.toFixed(6)).toString());
  };

  const handleUnitValChange = (val: string) => {
    if (val === '') {
      setConvertVal('');
      setConvertedResult('');
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num)) {
      if ((window as any).showToast) (window as any).showToast('Please enter a valid numeric value.');
      return;
    }
    setConvertVal(val);
    runUnitConversion(val, unitFrom, unitTo, unitCategory);
  };

  const handleUnitFromChange = (from: string) => {
    setUnitFrom(from);
    runUnitConversion(convertVal, from, unitTo, unitCategory);
  };

  const handleUnitToChange = (to: string) => {
    setUnitTo(to);
    runUnitConversion(convertVal, unitFrom, to, unitCategory);
  };

  const handleUnitCategoryChange = (cat: 'length' | 'mass' | 'temp') => {
    setUnitCategory(cat);
    const defaults = {
      length: { from: 'm', to: 'km' },
      mass: { from: 'kg', to: 'lb' },
      temp: { from: 'C', to: 'F' }
    };
    const defaultFrom = defaults[cat].from;
    const defaultTo = defaults[cat].to;
    setUnitFrom(defaultFrom);
    setUnitTo(defaultTo);
    runUnitConversion(convertVal, defaultFrom, defaultTo, cat);
  };

  // =========================================================================
  // Equation Solver State & Actions
  // =========================================================================
  const [solverMode, setSolverMode] = useState<'linear' | 'quadratic' | 'system'>('linear');

  // Linear states: ax + b = cx + d
  const [linearA, setLinearA] = useState('2');
  const [linearB, setLinearB] = useState('5');
  const [linearC, setLinearC] = useState('0');
  const [linearD, setLinearD] = useState('15');
  const [linearResult, setLinearResult] = useState<{ x: number | string; steps: string[] } | null>(null);

  // Quadratic states: ax^2 + bx + c = 0
  const [quadA, setQuadA] = useState('1');
  const [quadB, setQuadB] = useState('-5');
  const [quadC, setQuadC] = useState('6');
  const [quadResult, setQuadResult] = useState<{ x1: string; x2: string; steps: string[] } | null>(null);

  // Systems of 2 equations states:
  // a1 x + b1 y = c1
  // a2 x + b2 y = c2
  const [sysA1, setSysA1] = useState('1');
  const [sysB1, setSysB1] = useState('1');
  const [sysC1, setSysC1] = useState('5');
  const [sysA2, setSysA2] = useState('2');
  const [sysB2, setSysB2] = useState('-1');
  const [sysC2, setSysC2] = useState('1');
  const [sysResult, setSysResult] = useState<{ x: string; y: string; steps: string[] } | null>(null);

  const solveLinear = () => {
    if (linearA === '' || linearB === '' || linearC === '' || linearD === '') {
      if ((window as any).showToast) (window as any).showToast('Coefficients cannot be empty.');
      return;
    }
    const a = parseFloat(linearA);
    const b = parseFloat(linearB);
    const c = parseFloat(linearC);
    const d = parseFloat(linearD);

    if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d)) {
      if ((window as any).showToast) (window as any).showToast('Please enter valid numeric coefficients.');
      return;
    }

    const steps = [];
    steps.push(`Original equation: ${a}x + (${b}) = ${c}x + (${d})`);
    
    const lhs_x = a - c;
    const rhs_val = d - b;
    
    steps.push(`Subtract ${c}x from both sides: (${a} - ${c})x + (${b}) = ${d}`);
    steps.push(`Simplify: ${lhs_x}x + (${b}) = ${d}`);
    steps.push(`Subtract ${b} from both sides: ${lhs_x}x = ${d} - (${b})`);
    steps.push(`Simplify: ${lhs_x}x = ${rhs_val}`);

    if (lhs_x === 0) {
      if (rhs_val === 0) {
        setLinearResult({ x: 'Infinite solutions', steps: [...steps, 'Since 0 = 0, any value of x is a solution.'] });
      } else {
        setLinearResult({ x: 'No solution', steps: [...steps, `Since 0 = ${rhs_val}, which is false, there is no solution.`] });
      }
    } else {
      const ans = rhs_val / lhs_x;
      steps.push(`Divide both sides by ${lhs_x}: x = ${rhs_val} / ${lhs_x}`);
      steps.push(`x = ${Number(ans.toFixed(6))}`);
      setLinearResult({ x: ans, steps });
      confetti({ particleCount: 30, spread: 40, colors: ['#00f2fe', '#9d4edd'] });
    }
  };

  const solveQuadratic = () => {
    if (quadA === '' || quadB === '' || quadC === '') {
      if ((window as any).showToast) (window as any).showToast('Coefficients cannot be empty.');
      return;
    }
    const a = parseFloat(quadA);
    const b = parseFloat(quadB);
    const c = parseFloat(quadC);

    if (isNaN(a) || isNaN(b) || isNaN(c)) {
      if ((window as any).showToast) (window as any).showToast('Please enter valid numeric coefficients.');
      return;
    }

    if (a === 0) {
      if ((window as any).showToast) (window as any).showToast('Coefficient "a" cannot be 0 in a quadratic equation.');
      return;
    }

    const steps = [];
    steps.push(`Equation: ${a}x² + (${b})x + (${c}) = 0`);
    
    const disc = b * b - 4 * a * c;
    steps.push(`Calculate discriminant (D = b² - 4ac):`);
    steps.push(`D = (${b})² - 4 * (${a}) * (${c})`);
    steps.push(`D = ${b * b} - ${4 * a * c}`);
    steps.push(`D = ${disc}`);

    if (disc > 0) {
      const sqrtD = Math.sqrt(disc);
      steps.push(`Discriminant is positive (D > 0), two distinct real roots exist:`);
      steps.push(`x = (-b ± √D) / 2a`);
      steps.push(`x = (-(${b}) ± √${disc}) / (2 * ${a})`);
      steps.push(`x = (${-b} ± ${Number(sqrtD.toFixed(6))}) / ${2 * a}`);
      
      const x1 = (-b + sqrtD) / (2 * a);
      const x2 = (-b - sqrtD) / (2 * a);
      
      steps.push(`x₁ = (${-b} + ${Number(sqrtD.toFixed(6))}) / ${2 * a} = ${Number(x1.toFixed(6))}`);
      steps.push(`x₂ = (${-b} - ${Number(sqrtD.toFixed(6))}) / ${2 * a} = ${Number(x2.toFixed(6))}`);
      
      setQuadResult({
        x1: Number(x1.toFixed(6)).toString(),
        x2: Number(x2.toFixed(6)).toString(),
        steps
      });
      confetti({ particleCount: 30, spread: 40, colors: ['#00f2fe', '#9d4edd'] });
    } else if (disc === 0) {
      steps.push(`Discriminant is zero (D = 0), one double real root exists:`);
      steps.push(`x = -b / 2a`);
      steps.push(`x = -(${b}) / (2 * ${a})`);
      
      const x = -b / (2 * a);
      steps.push(`x = ${Number(x.toFixed(6))}`);
      
      setQuadResult({
        x1: Number(x.toFixed(6)).toString(),
        x2: Number(x.toFixed(6)).toString(),
        steps
      });
      confetti({ particleCount: 30, spread: 40, colors: ['#00f2fe', '#9d4edd'] });
    } else {
      const absD = Math.abs(disc);
      const sqrtAbsD = Math.sqrt(absD);
      steps.push(`Discriminant is negative (D < 0), complex roots exist:`);
      steps.push(`x = (-b ± i√|D|) / 2a`);
      steps.push(`x = (-(${b}) ± i√${absD}) / (2 * ${a})`);
      
      const realPart = -b / (2 * a);
      const imagPart = sqrtAbsD / (2 * a);
      
      const rStr = Number(realPart.toFixed(6)).toString();
      const iStr = Number(imagPart.toFixed(6)).toString();
      
      const x1 = `${rStr} + ${iStr}i`;
      const x2 = `${rStr} - ${iStr}i`;
      
      steps.push(`x₁ = ${x1}`);
      steps.push(`x₂ = ${x2}`);
      
      setQuadResult({ x1, x2, steps });
      confetti({ particleCount: 30, spread: 40, colors: ['#00f2fe', '#9d4edd'] });
    }
  };

  const solveSystem = () => {
    if (sysA1 === '' || sysB1 === '' || sysC1 === '' || sysA2 === '' || sysB2 === '' || sysC2 === '') {
      if ((window as any).showToast) (window as any).showToast('Coefficients cannot be empty.');
      return;
    }
    const a1 = parseFloat(sysA1);
    const b1 = parseFloat(sysB1);
    const c1 = parseFloat(sysC1);
    const a2 = parseFloat(sysA2);
    const b2 = parseFloat(sysB2);
    const c2 = parseFloat(sysC2);

    if (isNaN(a1) || isNaN(b1) || isNaN(c1) || isNaN(a2) || isNaN(b2) || isNaN(c2)) {
      if ((window as any).showToast) (window as any).showToast('Please enter valid numeric coefficients.');
      return;
    }

    const steps = [];
    steps.push(`System of Equations:`);
    steps.push(`(1) ${a1}x + (${b1})y = ${c1}`);
    steps.push(`(2) ${a2}x + (${b2})y = ${c2}`);
    
    const D = a1 * b2 - a2 * b1;
    steps.push(`Compute main determinant (D = a₁b₂ - a₂b₁):`);
    steps.push(`D = (${a1})*(${b2}) - (${a2})*(${b1}) = ${D}`);
    
    const Dx = c1 * b2 - c2 * b1;
    steps.push(`Compute x-determinant (Dx = c₁b₂ - c₂b₁):`);
    steps.push(`Dx = (${c1})*(${b2}) - (${c2})*(${b1}) = ${Dx}`);

    const Dy = a1 * c2 - a2 * c1;
    steps.push(`Compute y-determinant (Dy = a₁c₂ - a₂c₁):`);
    steps.push(`Dy = (${a1})*(${c2}) - (${a2})*(${c1}) = ${Dy}`);

    if (D === 0) {
      if (Dx === 0 && Dy === 0) {
        setSysResult({ x: 'Infinite solutions', y: 'Infinite solutions', steps: [...steps, 'Since D = Dx = Dy = 0, there are infinitely many dependent solutions.'] });
      } else {
        setSysResult({ x: 'No solution', y: 'No solution', steps: [...steps, 'Since D = 0 and Dx or Dy is non-zero, the lines are parallel and have no intersection.'] });
      }
    } else {
      const x = Dx / D;
      const y = Dy / D;
      
      steps.push(`Solve for x (x = Dx / D):`);
      steps.push(`x = ${Dx} / ${D} = ${Number(x.toFixed(6))}`);
      steps.push(`Solve for y (y = Dy / D):`);
      steps.push(`y = ${Dy} / ${D} = ${Number(y.toFixed(6))}`);
      
      setSysResult({
        x: Number(x.toFixed(6)).toString(),
        y: Number(y.toFixed(6)).toString(),
        steps
      });
      confetti({ particleCount: 30, spread: 40, colors: ['#00f2fe', '#9d4edd'] });
    }
  };

  // =========================================================================
  // Graph Plotter State & Actions
  // =========================================================================
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [plotterMode, setPlotterMode] = useState<'equation' | 'data'>('equation');
  
  // Graph range
  const [xMin, setXMin] = useState('-10');
  const [xMax, setXMax] = useState('10');
  const [yMin, setYMin] = useState('-10');
  const [yMax, setYMax] = useState('10');

  // Equation Plotter state
  const [equationStr, setEquationStr] = useState('x^2');
  
  // Data Plotter state
  const [dataPointsStr, setDataPointsStr] = useState('(1, 2)\n(2, 4)\n(3, 1)\n(4, 5)\n(5, 8)');
  const [connectPoints, setConnectPoints] = useState(true);
  const [showDataLabels, setShowDataLabels] = useState(true);
  const [showRegressionLine, setShowRegressionLine] = useState(false);

  // Mouse hover state for math coordinates tooltip on Canvas
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number; px: number; py: number } | null>(null);

  const parseDataPoints = (): { x: number; y: number }[] => {
    const list: { x: number; y: number }[] = [];
    const lines = dataPointsStr.split('\n');

    lines.forEach((line) => {
      const sanitized = line.replace(/[()]/g, '').trim();
      if (!sanitized) return;

      const parts = sanitized.split(/[,\s;]+/);
      if (parts.length >= 2) {
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        if (!isNaN(x) && !isNaN(y)) {
          list.push({ x, y });
        }
      }
    });

    return list;
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const x_min = parseFloat(xMin) || -10;
    const x_max = parseFloat(xMax) || 10;
    const y_min = parseFloat(yMin) || -10;
    const y_max = parseFloat(yMax) || 10;

    if (x_min >= x_max || y_min >= y_max) return;

    const x = x_min + (px / canvas.width) * (x_max - x_min);
    const y = y_min + ((canvas.height - py) / canvas.height) * (y_max - y_min);

    setHoverCoord({ x, y, px, py });
  };

  const handleCanvasMouseLeave = () => {
    setHoverCoord(null);
  };

  const downloadGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    tempCtx.fillStyle = isDark ? '#05060B' : '#F8FAFC';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    tempCtx.drawImage(canvas, 0, 0);

    const dataUrl = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `quantum-qbit-graph-${plotterMode}.png`;
    link.href = dataUrl;
    link.click();
    
    confetti({ particleCount: 30, spread: 40, colors: ['#00f2fe', '#9d4edd'] });
  };

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const x_min = parseFloat(xMin) || -10;
    const x_max = parseFloat(xMax) || 10;
    const y_min = parseFloat(yMin) || -10;
    const y_max = parseFloat(yMax) || 10;

    if (x_min >= x_max || y_min >= y_max) return;

    const width = canvas.width;
    const height = canvas.height;

    const toPixelX = (x: number) => ((x - x_min) / (x_max - x_min)) * width;
    const toPixelY = (y: number) => height - ((y - y_min) / (y_max - y_min)) * height;
    const toMathX = (px: number) => x_min + (px / width) * (x_max - x_min);

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const axisColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)';
    const textColor = isDark ? '#94a3b8' : '#475569';
    const plotColor = '#00f2fe';
    const regressionColor = '#ff007f';
    const pointColor = '#9d4edd';

    // Draw Grid Lines & Tick Labels
    ctx.lineWidth = 1;
    ctx.strokeStyle = gridColor;
    ctx.fillStyle = textColor;
    ctx.font = '10px monospace';

    const xRange = x_max - x_min;
    let xStep = 1;
    if (xRange > 100) xStep = 20;
    else if (xRange > 50) xStep = 10;
    else if (xRange > 20) xStep = 5;
    else if (xRange > 10) xStep = 2;
    else if (xRange > 2) xStep = 1;
    else xStep = 0.2;

    const xStart = Math.ceil(x_min / xStep) * xStep;
    for (let x = xStart; x <= x_max; x += xStep) {
      if (Math.abs(x) < 1e-10) continue;
      const px = toPixelX(x);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();

      const pyZero = Math.max(10, Math.min(height - 10, toPixelY(0) + 12));
      ctx.fillText(Number(x.toFixed(2)).toString(), px - 8, pyZero);
    }

    const yRange = y_max - y_min;
    let yStep = 1;
    if (yRange > 100) yStep = 20;
    else if (yRange > 50) yStep = 10;
    else if (yRange > 20) yStep = 5;
    else if (yRange > 10) yStep = 2;
    else if (yRange > 2) yStep = 1;
    else yStep = 0.2;

    const yStart = Math.ceil(y_min / yStep) * yStep;
    for (let y = yStart; y <= y_max; y += yStep) {
      if (Math.abs(y) < 1e-10) continue;
      const py = toPixelY(y);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();

      const pxZero = Math.max(5, Math.min(width - 25, toPixelX(0) + 5));
      ctx.fillText(Number(y.toFixed(2)).toString(), pxZero, py + 3);
    }

    // Axes
    ctx.lineWidth = 2;
    ctx.strokeStyle = axisColor;
    
    const pxZero = toPixelX(0);
    if (pxZero >= 0 && pxZero <= width) {
      ctx.beginPath();
      ctx.moveTo(pxZero, 0);
      ctx.lineTo(pxZero, height);
      ctx.stroke();
    }

    const pyZero = toPixelY(0);
    if (pyZero >= 0 && pyZero <= height) {
      ctx.beginPath();
      ctx.moveTo(0, pyZero);
      ctx.lineTo(width, pyZero);
      ctx.stroke();
    }

    if (pxZero >= 0 && pxZero <= width && pyZero >= 0 && pyZero <= height) {
      ctx.fillText('0', pxZero - 12, pyZero + 12);
    }

    // Plot Curves / Points
    if (plotterMode === 'equation') {
      ctx.lineWidth = 3;
      ctx.strokeStyle = plotColor;
      ctx.shadowBlur = 8;
      ctx.shadowColor = plotColor;

      ctx.beginPath();
      let first = true;

      for (let px = 0; px <= width; px++) {
        const x = toMathX(px);
        let y = 0;

        try {
          let expr = equationStr
            .toLowerCase()
            .replace(/\b(sin|cos|tan|log|ln|exp|sqrt|abs|pi|e)\b/g, (match) => {
              if (match === 'pi') return 'Math.PI';
              if (match === 'e') return 'Math.E';
              if (match === 'ln') return 'Math.log';
              return `Math.${match}`;
            })
            .replace(/\^/g, '**');

          expr = expr
            .replace(/(\d)(x)/g, '$1*$2')
            .replace(/(\d)(Math)/g, '$1*$2')
            .replace(/(\d)(\()/g, '$1*$2')
            .replace(/(x)(\()/g, '$1*$2')
            .replace(/(\))(\()/g, '$1*$2')
            .replace(/(\))([a-zA-Z0-9])/g, '$1*$2');

          const evalFunc = new Function('x', `try { return ${expr}; } catch(e) { return NaN; }`);
          y = evalFunc(x);
        } catch (err) {
          y = NaN;
        }

        if (isNaN(y) || !isFinite(y)) {
          first = true;
          continue;
        }

        const py = toPixelY(y);

        if (py < -height || py > height * 2) {
          first = true;
          continue;
        }

        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      const points = parseDataPoints();

      if (points.length > 0) {
        if (connectPoints && points.length > 1) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = plotColor;
          ctx.beginPath();
          points.forEach((pt, idx) => {
            const px = toPixelX(pt.x);
            const py = toPixelY(pt.y);
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();
        }

        if (showRegressionLine && points.length > 1) {
          const n = points.length;
          let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
          points.forEach(pt => {
            sumX += pt.x;
            sumY += pt.y;
            sumXY += pt.x * pt.y;
            sumX2 += pt.x * pt.x;
          });

          const denom = n * sumX2 - sumX * sumX;
          if (denom !== 0) {
            const m = (n * sumXY - sumX * sumY) / denom;
            const c = (sumY - m * sumX) / n;

            const x1_val = x_min;
            const y1_val = m * x1_val + c;
            const x2_val = x_max;
            const y2_val = m * x2_val + c;

            ctx.lineWidth = 2;
            ctx.strokeStyle = regressionColor;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(toPixelX(x1_val), toPixelY(y1_val));
            ctx.lineTo(toPixelX(x2_val), toPixelY(y2_val));
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = regressionColor;
            ctx.font = 'bold 12px monospace';
            const mStr = Number(m.toFixed(4));
            const cStr = Number(c.toFixed(4));
            const regEq = `Fit: y = ${mStr}x ${cStr >= 0 ? '+' : '-'} ${Math.abs(cStr)}`;
            ctx.fillText(regEq, 15, 25);
          }
        }

        points.forEach((pt) => {
          const px = toPixelX(pt.x);
          const py = toPixelY(pt.y);

          ctx.beginPath();
          ctx.arc(px, py, 6, 0, 2 * Math.PI);
          ctx.fillStyle = pointColor;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();

          if (showDataLabels) {
            ctx.fillStyle = textColor;
            ctx.font = '10px monospace';
            ctx.fillText(`(${Number(pt.x.toFixed(2))}, ${Number(pt.y.toFixed(2))})`, px + 8, py - 4);
          }
        });
      }
    }

    // Hover tooltip
    if (hoverCoord) {
      const { x, y, px, py } = hoverCoord;
      ctx.lineWidth = 1;
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
      ctx.setLineDash([3, 3]);

      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(px, py, 4, 0, 2 * Math.PI);
      ctx.fillStyle = plotColor;
      ctx.fill();

      const text = `X: ${x.toFixed(3)}, Y: ${y.toFixed(3)}`;
      ctx.font = '11px monospace';
      const textWidth = ctx.measureText(text).width;
      const tooltipW = textWidth + 12;
      const tooltipH = 20;

      let tx = px + 10;
      let ty = py - 15;
      if (tx + tooltipW > width) tx = px - tooltipW - 10;
      if (ty < 5) ty = py + 10;

      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = plotColor;
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.rect(tx, ty, tooltipW, tooltipH);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isDark ? '#ffffff' : '#0F172A';
      ctx.fillText(text, tx + 6, ty + 14);
    }
  };

  useEffect(() => {
    if (activeTab === 'plotter') {
      const timer = setTimeout(() => drawGraph(), 50);
      return () => clearTimeout(timer);
    }
  }, [
    activeTab,
    plotterMode,
    xMin,
    xMax,
    yMin,
    yMax,
    equationStr,
    dataPointsStr,
    connectPoints,
    showDataLabels,
    showRegressionLine,
    hoverCoord,
    theme
  ]);

  return (
    <div className="container" style={styles.container}>
      {/* Tab Switcher */}
      <div className="math-tabs-container">
        <button
          className={`math-tab-btn ${activeTab === 'scientific' ? 'active' : ''}`}
          onClick={() => setActiveTab('scientific')}
        >
          <Calculator size={16} /> Scientific Calculator
        </button>
        <button
          className={`math-tab-btn ${activeTab === 'base' ? 'active' : ''}`}
          onClick={() => setActiveTab('base')}
        >
          <Binary size={16} /> Base Converter
        </button>
        <button
          className={`math-tab-btn ${activeTab === 'unit' ? 'active' : ''}`}
          onClick={() => setActiveTab('unit')}
        >
          <RefreshCw size={16} /> Unit Converter
        </button>
        <button
          className={`math-tab-btn ${activeTab === 'solver' ? 'active' : ''}`}
          onClick={() => setActiveTab('solver')}
        >
          <Equal size={16} /> Equation Solver
        </button>
        <button
          className={`math-tab-btn ${activeTab === 'plotter' ? 'active' : ''}`}
          onClick={() => setActiveTab('plotter')}
        >
          <LineChart size={16} /> Graph Plotter
        </button>
      </div>

      {/* Tab Panel: Scientific Calculator */}
      {activeTab === 'scientific' && (
        <div style={styles.panelContent}>
          <div className="glass-card" style={styles.calculatorCard}>
            {/* Display screen */}
            <div style={styles.calcScreen}>
              <div style={styles.expression}>{calcDisplay || '0'}</div>
              <div style={styles.result}>{calcResult ? `= ${calcResult}` : ''}</div>
            </div>

            {/* Keys Grid */}
            <div style={styles.keysGrid}>
              {/* Scientific row */}
              {['sin(', 'cos(', 'tan(', 'ln(', 'sqrt('].map((fn) => (
                <button
                  key={fn}
                  style={styles.keyScientific}
                  onClick={() => handleCalcKeyPress(fn)}
                >
                  {fn.replace('(', '')}
                </button>
              ))}

              {/* Special values & operators */}
              <button style={styles.keyScientific} onClick={() => handleCalcKeyPress('π')}>π</button>
              <button style={styles.keyScientific} onClick={() => handleCalcKeyPress('e')}>e</button>
              <button style={styles.keyScientific} onClick={() => handleCalcKeyPress('^')}>xʸ</button>
              <button style={styles.keyScientific} onClick={() => handleCalcKeyPress('(')}>(</button>
              <button style={styles.keyScientific} onClick={() => handleCalcKeyPress(')')}>)</button>

              {/* standard pad */}
              {['7', '8', '9', '⌫', 'C'].map((k) => (
                <button
                  key={k}
                  style={k === 'C' ? styles.keyClear : k === '⌫' ? styles.keyBack : styles.keyNumber}
                  onClick={() => handleCalcKeyPress(k)}
                >
                  {k}
                </button>
              ))}

              {['4', '5', '6', '*', '/'].map((k) => (
                <button
                  key={k}
                  style={['*', '/'].includes(k) ? styles.keyOperator : styles.keyNumber}
                  onClick={() => handleCalcKeyPress(k)}
                >
                  {k === '*' ? '×' : k === '/' ? '÷' : k}
                </button>
              ))}

              {['1', '2', '3', '+', '-'].map((k) => (
                <button
                  key={k}
                  style={['+', '-'].includes(k) ? styles.keyOperator : styles.keyNumber}
                  onClick={() => handleCalcKeyPress(k)}
                >
                  {k}
                </button>
              ))}

              {['0', '.', '%', '='].map((k) => (
                <button
                  key={k}
                  style={k === '=' ? styles.keyEquals : styles.keyNumber}
                  onClick={() => handleCalcKeyPress(k)}
                  {...(k === '0' ? { style: { ...styles.keyNumber, gridColumn: 'span 2' } } : {})}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Panel: Base Converter */}
      {activeTab === 'base' && (
        <div style={styles.panelContent}>
          <div className="glass-card" style={styles.baseCard}>
            <h3 style={styles.sectionTitle}>Real-time Number Base Converter</h3>
            <p style={styles.sectionDesc}>
              Input a value in any of the fields below. The app converts binary, octal, decimal, and hexadecimal instantly.
            </p>

            <div style={styles.baseForm}>
              <div className="form-group">
                <div style={styles.fieldLabelRow}>
                  <label className="form-label">Decimal (Base 10)</label>
                  <span style={styles.fieldBaseTag}>DEC</span>
                </div>
                <input
                  type="text"
                  value={decVal}
                  onChange={(e) => handleBaseChange(e.target.value, 10)}
                  className="form-input"
                  style={{ fontFamily: 'monospace', fontSize: '1.05rem' }}
                  placeholder="e.g. 255"
                />
              </div>

              <div className="form-group">
                <div style={styles.fieldLabelRow}>
                  <label className="form-label">Binary (Base 2)</label>
                  <span style={styles.fieldBaseTag}>BIN</span>
                </div>
                <input
                  type="text"
                  value={binVal}
                  onChange={(e) => handleBaseChange(e.target.value, 2)}
                  className="form-input"
                  style={{ fontFamily: 'monospace', fontSize: '1.05rem', letterSpacing: '1px' }}
                  placeholder="e.g. 11111111"
                />
              </div>

              <div className="form-group">
                <div style={styles.fieldLabelRow}>
                  <label className="form-label">Hexadecimal (Base 16)</label>
                  <span style={styles.fieldBaseTag}>HEX</span>
                </div>
                <input
                  type="text"
                  value={hexVal}
                  onChange={(e) => handleBaseChange(e.target.value, 16)}
                  className="form-input"
                  style={{ fontFamily: 'monospace', fontSize: '1.05rem' }}
                  placeholder="e.g. FF"
                />
              </div>

              <div className="form-group">
                <div style={styles.fieldLabelRow}>
                  <label className="form-label">Octal (Base 8)</label>
                  <span style={styles.fieldBaseTag}>OCT</span>
                </div>
                <input
                  type="text"
                  value={octVal}
                  onChange={(e) => handleBaseChange(e.target.value, 8)}
                  className="form-input"
                  style={{ fontFamily: 'monospace', fontSize: '1.05rem' }}
                  placeholder="e.g. 377"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Panel: Unit Converter */}
      {activeTab === 'unit' && (
        <div style={styles.panelContent}>
          <div className="glass-card" style={styles.unitCard}>
            <h3 style={styles.sectionTitle}>General Unit Converter</h3>
            
            {/* Category Selector Tabs */}
            <div style={styles.unitCategories}>
              {[
                { id: 'length', label: 'Length' },
                { id: 'mass', label: 'Mass / Weight' },
                { id: 'temp', label: 'Temperature' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  style={{
                    ...styles.unitCatBtn,
                    ...(unitCategory === cat.id ? styles.activeUnitCatBtn : {})
                  }}
                  onClick={() => handleUnitCategoryChange(cat.id as any)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Input grid */}
            <div className="math-converter-grid" style={styles.converterGrid}>
              {/* Input Value */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                <span style={styles.inputLabel}>Value to Convert</span>
                <input
                  type="number"
                  value={convertVal}
                  onChange={(e) => handleUnitValChange(e.target.value)}
                  className="form-input"
                  style={styles.unitInput}
                />
              </div>

              {/* Unit From */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                <span style={styles.inputLabel}>From Unit</span>
                <div style={styles.selectWrapper}>
                  <select
                    value={unitFrom}
                    onChange={(e) => handleUnitFromChange(e.target.value)}
                    style={styles.unitSelect}
                  >
                    {unitLists[unitCategory].map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Unit To */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                <span style={styles.inputLabel}>To Unit</span>
                <div style={styles.selectWrapper}>
                  <select
                    value={unitTo}
                    onChange={(e) => handleUnitToChange(e.target.value)}
                    style={styles.unitSelect}
                  >
                    {unitLists[unitCategory].map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Result display */}
            <div style={styles.unitResultContainer}>
              <span style={styles.resultLabel}>Converted Result</span>
              <div style={styles.resultDisplayBox}>
                <span style={styles.resultValue}>{convertedResult || '0'}</span>
                <span style={styles.resultUnitTag}>
                  {unitLists[unitCategory].find(u => u.id === unitTo)?.label.split(' ')[0]}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Panel: Equation Solver */}
      {activeTab === 'solver' && (
        <div style={styles.panelContent}>
          <div className="glass-card" style={styles.solverCard}>
            <h3 style={styles.sectionTitle}>Interactive Equation Solver</h3>
            <p style={styles.sectionDesc}>
              Solve linear, quadratic, or systems of equations with detailed, step-by-step solutions.
            </p>

            {/* Solver Mode Selector */}
            <div style={styles.solverModes}>
              {[
                { id: 'linear', label: 'Linear (ax + b = cx + d)' },
                { id: 'quadratic', label: 'Quadratic (ax² + bx + c = 0)' },
                { id: 'system', label: 'System (2 Variables)' }
              ].map((mode) => (
                <button
                  key={mode.id}
                  style={{
                    ...styles.solverModeBtn,
                    ...(solverMode === mode.id ? styles.activeSolverModeBtn : {})
                  }}
                  onClick={() => setSolverMode(mode.id as any)}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Solver Inputs based on Mode */}
            {solverMode === 'linear' && (
              <div style={styles.solverInputsContainer}>
                <div style={styles.equationDisplay}>
                  <span>Input coefficients for: </span>
                  <code style={styles.equationCode}>ax + b = cx + d</code>
                </div>
                <div style={styles.inputsRowGrid}>
                  <div className="form-group">
                    <label className="form-label">a</label>
                    <input
                      type="number"
                      value={linearA}
                      onChange={(e) => setLinearA(e.target.value)}
                      className="form-input"
                      style={styles.coefInput}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">b</label>
                    <input
                      type="number"
                      value={linearB}
                      onChange={(e) => setLinearB(e.target.value)}
                      className="form-input"
                      style={styles.coefInput}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">c</label>
                    <input
                      type="number"
                      value={linearC}
                      onChange={(e) => setLinearC(e.target.value)}
                      className="form-input"
                      style={styles.coefInput}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">d</label>
                    <input
                      type="number"
                      value={linearD}
                      onChange={(e) => setLinearD(e.target.value)}
                      className="form-input"
                      style={styles.coefInput}
                    />
                  </div>
                </div>
                <button className="btn btn-primary" onClick={solveLinear} style={styles.solveBtn}>
                  Solve Equation
                </button>

                {linearResult && (
                  <div style={styles.resultContainer}>
                    <h4 style={styles.resultTitle}>Solution:</h4>
                    <div style={styles.resultBox}>
                      <span style={styles.resultLabelText}>x = </span>
                      <span style={styles.resultValueText}>{linearResult.x}</span>
                    </div>

                    <h4 style={styles.stepsTitle}>Solving Steps:</h4>
                    <div style={styles.stepsBox}>
                      {linearResult.steps.map((step, idx) => (
                        <div key={idx} style={styles.stepRow}>
                          <span style={styles.stepNumber}>{idx + 1}.</span>
                          <span style={styles.stepText}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {solverMode === 'quadratic' && (
              <div style={styles.solverInputsContainer}>
                <div style={styles.equationDisplay}>
                  <span>Input coefficients for: </span>
                  <code style={styles.equationCode}>ax² + bx + c = 0</code>
                </div>
                <div style={styles.inputsRowGrid3}>
                  <div className="form-group">
                    <label className="form-label">a</label>
                    <input
                      type="number"
                      value={quadA}
                      onChange={(e) => setQuadA(e.target.value)}
                      className="form-input"
                      style={styles.coefInput}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">b</label>
                    <input
                      type="number"
                      value={quadB}
                      onChange={(e) => setQuadB(e.target.value)}
                      className="form-input"
                      style={styles.coefInput}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">c</label>
                    <input
                      type="number"
                      value={quadC}
                      onChange={(e) => setQuadC(e.target.value)}
                      className="form-input"
                      style={styles.coefInput}
                    />
                  </div>
                </div>
                <button className="btn btn-primary" onClick={solveQuadratic} style={styles.solveBtn}>
                  Solve Equation
                </button>

                {quadResult && (
                  <div style={styles.resultContainer}>
                    <h4 style={styles.resultTitle}>Solution:</h4>
                    <div style={styles.quadResultsRow}>
                      <div style={styles.resultBox}>
                        <span style={styles.resultLabelText}>x₁ = </span>
                        <span style={styles.resultValueText}>{quadResult.x1}</span>
                      </div>
                      <div style={styles.resultBox}>
                        <span style={styles.resultLabelText}>x₂ = </span>
                        <span style={styles.resultValueText}>{quadResult.x2}</span>
                      </div>
                    </div>

                    <h4 style={styles.stepsTitle}>Solving Steps:</h4>
                    <div style={styles.stepsBox}>
                      {quadResult.steps.map((step, idx) => (
                        <div key={idx} style={styles.stepRow}>
                          <span style={styles.stepNumber}>{idx + 1}.</span>
                          <span style={styles.stepText}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {solverMode === 'system' && (
              <div style={styles.solverInputsContainer}>
                <div style={styles.equationDisplay}>
                  <span>Input coefficients for: </span>
                  <div style={styles.systemEquationLines}>
                    <code style={styles.equationCode}>a₁x + b₁y = c₁</code>
                    <code style={styles.equationCode}>a₂x + b₂y = c₂</code>
                  </div>
                </div>
                <div style={styles.systemInputsContainer}>
                  <div style={styles.inputsHeading}>Equation 1:</div>
                  <div style={styles.inputsRowGrid3}>
                    <div className="form-group">
                      <label className="form-label">a₁</label>
                      <input
                        type="number"
                        value={sysA1}
                        onChange={(e) => setSysA1(e.target.value)}
                        className="form-input"
                        style={styles.coefInput}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">b₁</label>
                      <input
                        type="number"
                        value={sysB1}
                        onChange={(e) => setSysB1(e.target.value)}
                        className="form-input"
                        style={styles.coefInput}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">c₁</label>
                      <input
                        type="number"
                        value={sysC1}
                        onChange={(e) => setSysC1(e.target.value)}
                        className="form-input"
                        style={styles.coefInput}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', ...styles.inputsHeading }}>Equation 2:</div>
                  <div style={styles.inputsRowGrid3}>
                    <div className="form-group">
                      <label className="form-label">a₂</label>
                      <input
                        type="number"
                        value={sysA2}
                        onChange={(e) => setSysA2(e.target.value)}
                        className="form-input"
                        style={styles.coefInput}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">b₂</label>
                      <input
                        type="number"
                        value={sysB2}
                        onChange={(e) => setSysB2(e.target.value)}
                        className="form-input"
                        style={styles.coefInput}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">c₂</label>
                      <input
                        type="number"
                        value={sysC2}
                        onChange={(e) => setSysC2(e.target.value)}
                        className="form-input"
                        style={styles.coefInput}
                      />
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={solveSystem} style={styles.solveBtn}>
                  Solve System
                </button>

                {sysResult && (
                  <div style={styles.resultContainer}>
                    <h4 style={styles.resultTitle}>Solution:</h4>
                    <div style={styles.quadResultsRow}>
                      <div style={styles.resultBox}>
                        <span style={styles.resultLabelText}>x = </span>
                        <span style={styles.resultValueText}>{sysResult.x}</span>
                      </div>
                      <div style={styles.resultBox}>
                        <span style={styles.resultLabelText}>y = </span>
                        <span style={styles.resultValueText}>{sysResult.y}</span>
                      </div>
                    </div>

                    <h4 style={styles.stepsTitle}>Solving Steps:</h4>
                    <div style={styles.stepsBox}>
                      {sysResult.steps.map((step, idx) => (
                        <div key={idx} style={styles.stepRow}>
                          <span style={styles.stepNumber}>{idx + 1}.</span>
                          <span style={styles.stepText}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Panel: Graph Plotter */}
      {activeTab === 'plotter' && (
        <div style={styles.panelContent}>
          <div className="glass-card" style={styles.plotterCard}>
            <h3 style={styles.sectionTitle}>Interactive Function & Data Plotter</h3>
            <p style={styles.sectionDesc}>
              Plot mathematical functions (e.g., <code>x^2</code>, <code>sin(x)</code>) or enter scatter coordinate data to calculate linear regression.
            </p>

            {/* Plotter Mode Selector */}
            <div style={styles.plotterModes}>
              {[
                { id: 'equation', label: 'Plot Equation' },
                { id: 'data', label: 'Plot Coordinate Data' }
              ].map((mode) => (
                <button
                  key={mode.id}
                  style={{
                    ...styles.plotterModeBtn,
                    ...(plotterMode === mode.id ? styles.activePlotterModeBtn : {})
                  }}
                  onClick={() => setPlotterMode(mode.id as any)}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="math-plotter-workspace" style={styles.plotterWorkspace}>
              {/* Controls Column */}
              <div style={styles.plotterControls}>
                {plotterMode === 'equation' ? (
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label" style={styles.inputLabel}>Function f(x)</label>
                    <div style={styles.inputWithPrefix}>
                      <span style={styles.inputPrefix}>y = </span>
                      <input
                        type="text"
                        value={equationStr}
                        onChange={(e) => setEquationStr(e.target.value)}
                        className="form-input"
                        style={styles.formulaInput}
                        placeholder="e.g. x^2 - 3*x"
                      />
                    </div>
                    <span style={styles.helpText}>Supports x, sin(x), cos(x), tan(x), ln(x), sqrt(x), ^ for exponent.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label className="form-label" style={styles.inputLabel}>Data Points (x, y)</label>
                      <textarea
                        rows={6}
                        value={dataPointsStr}
                        onChange={(e) => setDataPointsStr(e.target.value)}
                        className="form-input"
                        style={styles.textareaInput}
                        placeholder="(1, 2)&#10;(2, 4)&#10;(3, 1)"
                      />
                      <span style={styles.helpText}>Enter one point per line as (x,y) or x,y.</span>
                    </div>

                    <div style={styles.checkboxGroup}>
                      <label style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={connectPoints}
                          onChange={(e) => setConnectPoints(e.target.checked)}
                          style={styles.checkbox}
                        />
                        Connect with Lines
                      </label>
                      <label style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={showDataLabels}
                          onChange={(e) => setShowDataLabels(e.target.checked)}
                          style={styles.checkbox}
                        />
                        Show Coordinate Labels
                      </label>
                      <label style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={showRegressionLine}
                          onChange={(e) => setShowRegressionLine(e.target.checked)}
                          style={styles.checkbox}
                        />
                        Show Linear Regression Fit
                      </label>
                    </div>
                  </div>
                )}

                {/* Viewport Range Config */}
                <div style={styles.rangeConfigContainer}>
                  <div style={styles.rangeTitle}>Graph Viewport Limits</div>
                  <div style={styles.rangeGrid}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={styles.rangeLabel}>X Min</label>
                      <input
                        type="number"
                        value={xMin}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === '-') {
                            setXMin(val);
                            return;
                          }
                          const num = parseFloat(val);
                          if (isNaN(num)) {
                            if ((window as any).showToast) (window as any).showToast('Limit must be a valid number.');
                            return;
                          }
                          setXMin(val);
                        }}
                        className="form-input"
                        style={styles.rangeInput}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={styles.rangeLabel}>X Max</label>
                      <input
                        type="number"
                        value={xMax}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === '-') {
                            setXMax(val);
                            return;
                          }
                          const num = parseFloat(val);
                          if (isNaN(num)) {
                            if ((window as any).showToast) (window as any).showToast('Limit must be a valid number.');
                            return;
                          }
                          setXMax(val);
                        }}
                        className="form-input"
                        style={styles.rangeInput}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={styles.rangeLabel}>Y Min</label>
                      <input
                        type="number"
                        value={yMin}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === '-') {
                            setYMin(val);
                            return;
                          }
                          const num = parseFloat(val);
                          if (isNaN(num)) {
                            if ((window as any).showToast) (window as any).showToast('Limit must be a valid number.');
                            return;
                          }
                          setYMin(val);
                        }}
                        className="form-input"
                        style={styles.rangeInput}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={styles.rangeLabel}>Y Max</label>
                      <input
                        type="number"
                        value={yMax}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === '-') {
                            setYMax(val);
                            return;
                          }
                          const num = parseFloat(val);
                          if (isNaN(num)) {
                            if ((window as any).showToast) (window as any).showToast('Limit must be a valid number.');
                            return;
                          }
                          setYMax(val);
                        }}
                        className="form-input"
                        style={styles.rangeInput}
                      />
                    </div>
                  </div>
                </div>

                <div style={styles.actionButtons}>
                  <button className="btn btn-secondary" onClick={() => {
                    setXMin('-10'); setXMax('10'); setYMin('-10'); setYMax('10');
                  }} style={styles.resetBtn}>
                    Reset Limits
                  </button>
                  <button className="btn btn-primary" onClick={downloadGraph} style={styles.downloadBtn}>
                    <Download size={16} /> Save Graph
                  </button>
                </div>
              </div>

              {/* Canvas Column */}
              <div style={styles.canvasWrapperColumn}>
                <div style={styles.canvasOuterBorder}>
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={400}
                    style={styles.plotterCanvas}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseLeave={handleCanvasMouseLeave}
                  />
                </div>
                <div style={styles.canvasHint}>
                  Hover mouse over canvas to see coordinate tracking.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '850px',
    margin: '0 auto',
  },
  panelContent: {
    marginTop: '10px',
  },
  calculatorCard: {
    padding: '24px',
    maxWidth: '440px',
    margin: '0 auto',
  },
  calcScreen: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '10px',
    border: '1px solid var(--border-glass)',
    padding: '20px',
    textAlign: 'right' as const,
    minHeight: '100px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    marginBottom: '20px',
    wordBreak: 'break-all' as const,
  },
  expression: {
    color: 'var(--text-secondary)',
    fontFamily: 'monospace',
    fontSize: '1rem',
    minHeight: '20px',
  },
  result: {
    color: 'var(--primary)',
    fontFamily: 'monospace',
    fontSize: '1.8rem',
    fontWeight: 600,
    marginTop: '8px',
    minHeight: '38px',
  },
  keysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '8px',
  },
  keyScientific: {
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-heading)',
    fontWeight: 500,
    fontSize: '0.85rem',
    padding: '12px 6px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  keyNumber: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-heading)',
    fontWeight: 600,
    fontSize: '1.1rem',
    padding: '14px 6px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  keyOperator: {
    background: 'rgba(157, 78, 221, 0.08)',
    border: '1px solid rgba(157, 78, 221, 0.15)',
    borderRadius: '8px',
    color: '#d8b4fe',
    fontFamily: 'var(--font-heading)',
    fontWeight: 600,
    fontSize: '1.1rem',
    padding: '14px 6px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  keyClear: {
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    color: '#fca5a5',
    fontFamily: 'var(--font-heading)',
    fontWeight: 600,
    fontSize: '1.1rem',
    padding: '14px 6px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  keyBack: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-heading)',
    fontWeight: 600,
    fontSize: '1.1rem',
    padding: '14px 6px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  keyEquals: {
    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
    border: 'none',
    borderRadius: '8px',
    color: '#020306',
    fontFamily: 'var(--font-heading)',
    fontWeight: 600,
    fontSize: '1.25rem',
    padding: '14px 6px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  baseCard: {
    padding: '30px',
    maxWidth: '540px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: '1.3rem',
    fontWeight: 600,
    marginBottom: '8px',
    textAlign: 'center' as const,
  },
  sectionDesc: {
    color: 'var(--text-secondary)',
    fontSize: '0.88rem',
    textAlign: 'center' as const,
    lineHeight: 1.5,
    marginBottom: '24px',
  },
  baseForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  fieldLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  fieldBaseTag: {
    fontSize: '0.7rem',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border-glass)',
    borderRadius: '4px',
    padding: '2px 6px',
    fontFamily: 'monospace',
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  unitCard: {
    padding: '30px',
    maxWidth: '640px',
    margin: '0 auto',
  },
  unitCategories: {
    display: 'flex',
    gap: '6px',
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '4px',
    marginBottom: '24px',
  },
  unitCatBtn: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-heading)',
    fontSize: '0.88rem',
    fontWeight: 500,
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  activeUnitCatBtn: {
    color: 'var(--secondary)',
    background: 'rgba(157, 78, 221, 0.08)',
  },
  converterGrid: {
  },
  inputLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  unitInput: {
    fontFamily: 'monospace',
    fontSize: '1rem',
  },
  selectWrapper: {
    width: '100%',
  },
  unitSelect: {
    width: '100%',
    background: 'var(--bg-darker)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '12px 14px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.88rem',
    outline: 'none',
    cursor: 'pointer',
  },
  unitResultContainer: {
    borderTop: '1px solid var(--border-glass)',
    paddingTop: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  resultLabel: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  resultDisplayBox: {
    background: 'rgba(0,0,0,0.15)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultValue: {
    fontFamily: 'monospace',
    fontSize: '1.4rem',
    fontWeight: 600,
    color: 'var(--primary)',
  },
  resultUnitTag: {
    fontSize: '0.8rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-glass)',
    padding: '4px 8px',
    borderRadius: '6px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  solverCard: {
    padding: '30px',
    maxWidth: '640px',
    margin: '0 auto',
  },
  solverModes: {
    display: 'flex',
    gap: '6px',
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '4px',
    marginBottom: '24px',
  },
  solverModeBtn: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-heading)',
    fontSize: '0.85rem',
    fontWeight: 500,
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  activeSolverModeBtn: {
    color: 'var(--primary)',
    background: 'rgba(0, 242, 254, 0.05)',
  },
  solverInputsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  equationDisplay: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '8px',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
  equationCode: {
    fontFamily: 'monospace',
    fontSize: '1.05rem',
    color: 'var(--primary)',
    fontWeight: 'bold' as const,
    background: 'rgba(0,0,0,0.2)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  inputsRowGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  },
  inputsRowGrid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  coefInput: {
    textAlign: 'center' as const,
    fontFamily: 'monospace',
    fontSize: '1.1rem',
  },
  solveBtn: {
    width: '100%',
    padding: '12px',
    fontWeight: 600,
    marginTop: '6px',
  },
  resultContainer: {
    borderTop: '1px solid var(--border-glass)',
    paddingTop: '20px',
    marginTop: '10px',
  },
  resultTitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    marginBottom: '10px',
    fontWeight: 600,
  },
  resultBox: {
    background: 'rgba(0, 242, 254, 0.02)',
    border: '1px solid rgba(0, 242, 254, 0.15)',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '1.3rem',
    fontFamily: 'monospace',
    flex: 1,
  },
  resultLabelText: {
    color: 'var(--text-muted)',
  },
  resultValueText: {
    color: 'var(--primary)',
    fontWeight: 600,
  },
  quadResultsRow: {
    display: 'flex',
    gap: '12px',
    width: '100%',
  },
  stepsTitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    marginTop: '20px',
    marginBottom: '10px',
    fontWeight: 600,
  },
  stepsBox: {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    maxHeight: '220px',
    overflowY: 'auto' as const,
  },
  stepRow: {
    display: 'flex',
    gap: '8px',
    fontSize: '0.88rem',
    lineHeight: 1.4,
  },
  stepNumber: {
    color: 'var(--secondary)',
    fontWeight: 'bold' as const,
    fontFamily: 'monospace',
    minWidth: '18px',
  },
  stepText: {
    color: 'var(--text-primary)',
  },
  systemEquationLines: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    alignItems: 'center',
  },
  systemInputsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '16px',
  },
  inputsHeading: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    marginBottom: '4px',
  },
  plotterCard: {
    padding: '30px',
    maxWidth: '880px',
    margin: '0 auto',
  },
  plotterModes: {
    display: 'flex',
    gap: '6px',
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '4px',
    marginBottom: '24px',
  },
  plotterModeBtn: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-heading)',
    fontSize: '0.88rem',
    fontWeight: 500,
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  activePlotterModeBtn: {
    color: 'var(--secondary)',
    background: 'rgba(157, 78, 221, 0.08)',
  },
  plotterWorkspace: {
  },
  plotterControls: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  inputWithPrefix: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--bg-darker)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  inputPrefix: {
    padding: '12px 14px',
    borderRight: '1px solid var(--border-glass)',
    color: 'var(--text-secondary)',
    fontFamily: 'monospace',
    fontWeight: 600,
  },
  formulaInput: {
    border: 'none',
    background: 'transparent',
    flex: 1,
    padding: '12px 14px',
    color: 'var(--text-primary)',
    fontFamily: 'monospace',
    fontSize: '1rem',
    outline: 'none',
  },
  helpText: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    marginTop: '4px',
    display: 'block',
    lineHeight: 1.4,
  },
  textareaInput: {
    fontFamily: 'monospace',
    fontSize: '0.92rem',
    resize: 'vertical' as const,
    width: '100%',
    padding: '10px 12px',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '12px 14px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    userSelect: 'none' as const,
  },
  checkbox: {
    cursor: 'pointer',
    width: '15px',
    height: '15px',
    accentColor: 'var(--primary)',
  },
  rangeConfigContainer: {
    background: 'rgba(0,0,0,0.1)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '14px',
  },
  rangeTitle: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    marginBottom: '10px',
  },
  rangeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  rangeLabel: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    marginBottom: '4px',
  },
  rangeInput: {
    padding: '8px 6px',
    fontFamily: 'monospace',
    fontSize: '0.88rem',
    textAlign: 'center' as const,
  },
  actionButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '6px',
  },
  resetBtn: {
    flex: 1,
  },
  downloadBtn: {
    flex: 1.2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  canvasWrapperColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
    width: '100%',
  },
  canvasOuterBorder: {
    border: '1px solid var(--border-glass)',
    borderRadius: '10px',
    overflow: 'hidden',
    background: '#05060B',
    display: 'flex',
    width: '100%',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
  },
  plotterCanvas: {
    display: 'block',
    width: '100%',
    height: 'auto',
    aspectRatio: '5/4',
    cursor: 'crosshair',
    background: 'transparent',
  },
  canvasHint: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textAlign: 'center' as const,
  },
};

export default MathCalculators;

