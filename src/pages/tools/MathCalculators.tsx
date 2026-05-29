import React, { useState, useEffect, useRef } from 'react';
import { Calculator, Binary, RefreshCw, Equal, LineChart, Download } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MathCalculatorsProps {
  defaultTab?: 'scientific' | 'base' | 'unit' | 'solver' | 'plotter';
}

export const MathCalculators: React.FC<MathCalculatorsProps> = ({ defaultTab }) => {
  const [activeTab, setActiveTab] = useState<'scientific' | 'base' | 'unit' | 'solver' | 'plotter'>(defaultTab || 'scientific');

  useEffect(() => {
    if (defaultTab) {
      Promise.resolve().then(() => {
        setActiveTab(defaultTab);
      });
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
  const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg');

  const calculateResult = (display = calcDisplay, mode = angleMode) => {
    try {
      // Sanitize expression: only allow numbers, math operators, math functions
      const expression = display
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
      const customMath = Object.create(Math);
      customMath.sin = mode === 'deg' ? (x: number) => Math.sin((x * Math.PI) / 180) : Math.sin;
      customMath.cos = mode === 'deg' ? (x: number) => Math.cos((x * Math.PI) / 180) : Math.cos;
      customMath.tan = mode === 'deg' ? (x: number) => {
        const normalized = ((x % 180) + 180) % 180;
        if (Math.abs(normalized - 90) < 1e-9) return NaN;
        return Math.tan((x * Math.PI) / 180);
      } : (x: number) => {
        const normalized = ((x % Math.PI) + Math.PI) % Math.PI;
        if (Math.abs(normalized - Math.PI / 2) < 1e-9) return NaN;
        return Math.tan(x);
      };

      const evalFunc = new Function('Math', `return ${expression}`);
      const res = evalFunc(customMath);
      
      if (res === null || res === undefined) {
        setCalcResult('undefined');
      } else if (typeof res === 'number') {
        if (isNaN(res)) {
          setCalcResult('undefined');
        } else if (res === Infinity) {
          setCalcResult('Infinity');
        } else if (res === -Infinity) {
          setCalcResult('-Infinity');
        } else {
          let val = res;
          if (Math.abs(val) < 1e-12) {
            val = 0;
          }
          setCalcResult(Number(val.toFixed(8)).toString());
          // Small success vibration/confetti if they compute something neat
          if (display.includes('sin') || display.includes('cos') || display.includes('π')) {
            confetti({ particleCount: 30, spread: 40, colors: ['#00f2fe', '#ffffff'] });
          }
        }
      } else {
        setCalcResult(String(res));
      }
    } catch {
      setCalcResult('Error');
    }
  };

  useEffect(() => {
    if (calcDisplay) {
      Promise.resolve().then(() => {
        calculateResult(calcDisplay, angleMode);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angleMode]);

  const handleCalcKeyPress = (key: string) => {
    if (key === 'C') {
      setCalcDisplay('');
      setCalcResult('');
    } else if (key === '⌫') {
      setCalcDisplay((prev) => prev.slice(0, -1));
    } else if (key === '=') {
      calculateResult(calcDisplay, angleMode);
    } else {
      setCalcDisplay((prev) => prev + key);
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
            if (window.showToast) window.showToast('Decimal input must contain only digits (0-9).');
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
            if (window.showToast) window.showToast('Binary input must contain only 0 and 1.');
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
            if (window.showToast) window.showToast('Hexadecimal input must contain only 0-9 and A-F.');
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
            if (window.showToast) window.showToast('Octal input must contain only digits (0-7).');
            return;
          }
          decimal = parseInt(value, 8);
          setOctVal(value);
          setDecVal(isNaN(decimal) ? '' : decimal.toString(10));
          setBinVal(isNaN(decimal) ? '' : decimal.toString(2));
          setHexVal(isNaN(decimal) ? '' : decimal.toString(16).toUpperCase());
          break;
      }
    } catch {
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
      if (window.showToast) window.showToast('Please enter a valid numeric value.');
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
  const [solverMode, setSolverMode] = useState<'linear' | 'quadratic' | 'system' | 'custom'>('custom');

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

  // Custom equation solver states
  const [customEq, setCustomEq] = useState('x^2 - 5x + 6 = 0');
  const [customResult, setCustomResult] = useState<{
    roots: (number | string)[];
    type: 'linear' | 'quadratic' | 'general' | 'invalid';
    steps: string[];
  } | null>(null);

  const solveLinear = () => {
    if (linearA === '' || linearB === '' || linearC === '' || linearD === '') {
      if (window.showToast) window.showToast('Coefficients cannot be empty.');
      return;
    }
    const a = parseFloat(linearA);
    const b = parseFloat(linearB);
    const c = parseFloat(linearC);
    const d = parseFloat(linearD);

    if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d)) {
      if (window.showToast) window.showToast('Please enter valid numeric coefficients.');
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
      if (window.showToast) window.showToast('Coefficients cannot be empty.');
      return;
    }
    const a = parseFloat(quadA);
    const b = parseFloat(quadB);
    const c = parseFloat(quadC);

    if (isNaN(a) || isNaN(b) || isNaN(c)) {
      if (window.showToast) window.showToast('Please enter valid numeric coefficients.');
      return;
    }

    if (a === 0) {
      if (window.showToast) window.showToast('Coefficient "a" cannot be 0 in a quadratic equation.');
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
      if (window.showToast) window.showToast('Coefficients cannot be empty.');
      return;
    }
    const a1 = parseFloat(sysA1);
    const b1 = parseFloat(sysB1);
    const c1 = parseFloat(sysC1);
    const a2 = parseFloat(sysA2);
    const b2 = parseFloat(sysB2);
    const c2 = parseFloat(sysC2);

    if (isNaN(a1) || isNaN(b1) || isNaN(c1) || isNaN(a2) || isNaN(b2) || isNaN(c2)) {
      if (window.showToast) window.showToast('Please enter valid numeric coefficients.');
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

  const solveCustomEquation = () => {
    if (!customEq.trim()) {
      if (window.showToast) window.showToast('Please enter an equation.');
      return;
    }

    const steps: string[] = [];
    steps.push(`Entered equation: \`${customEq}\``);

    // 1. Split into LHS and RHS
    const parts = customEq.split('=');
    if (parts.length > 2) {
      setCustomResult({
        roots: [],
        type: 'invalid',
        steps: [...steps, 'Error: An equation can have at most one "=" sign.']
      });
      return;
    }

    let lhsRaw = parts[0].trim();
    let rhsRaw = parts.length === 2 ? parts[1].trim() : '0';

    if (!lhsRaw) lhsRaw = '0';
    if (!rhsRaw) rhsRaw = '0';

    steps.push(`Separate sides: LHS = \`${lhsRaw}\`, RHS = \`${rhsRaw}\``);

    // 2. Helper to clean math expression with variable x
    const cleanExpr = (str: string): string => {
      let expr = str.toLowerCase();
      // Constants
      expr = expr.replace(/π/g, 'Math.PI').replace(/\bpi\b/g, 'Math.PI').replace(/\be\b/g, 'Math.E');
      // Functions
      expr = expr.replace(/\bsin\(/g, 'Math.sin(')
                 .replace(/\bcos\(/g, 'Math.cos(')
                 .replace(/\btan\(/g, 'Math.tan(')
                 .replace(/\bln\(/g, 'Math.log(')
                 .replace(/\bsqrt\(/g, 'Math.sqrt(');
      
      // Powers
      expr = expr.replace(/\^/g, '**');

      // Implicit multiplication
      // Number followed by x or Math or (
      expr = expr.replace(/(\d+(?:\.\d+)?)\s*([x(]|math)/gi, '$1*$2');
      // x or ) followed by number or Math or (
      expr = expr.replace(/([x)])\s*(\d|math|\()/gi, '$1*$2');

      return expr;
    };

    const lhsClean = cleanExpr(lhsRaw);
    const rhsClean = cleanExpr(rhsRaw);

    // 3. Create evaluation function f(x) = LHS - RHS
    // We validate if characters are safe
    const allowedRegex = /^[0-9x.+\-*/%()eMathPIElnsqrt,\s*]+$/i;
    const lhsSanitized = lhsClean.replace(/Math\.[a-zA-Z]+/g, '');
    const rhsSanitized = rhsClean.replace(/Math\.[a-zA-Z]+/g, '');

    if (!allowedRegex.test(lhsSanitized) || !allowedRegex.test(rhsSanitized)) {
      setCustomResult({
        roots: [],
        type: 'invalid',
        steps: [...steps, 'Error: The equation contains invalid characters or unsupported functions. Please use x as the variable.']
      });
      return;
    }

    let f: (x: number) => number;
    try {
      const evalLHS = new Function('x', `return ${lhsClean};`);
      const evalRHS = new Function('x', `return ${rhsClean};`);
      f = (x: number) => {
        const lhs = evalLHS(x);
        const rhs = evalRHS(x);
        return lhs - rhs;
      };
      
      // Test run to see if it doesn't throw immediate errors
      const testVal = f(0);
      if (isNaN(testVal) && f(1) === testVal && f(-1) === testVal) {
        throw new Error("Invalid expression");
      }
    } catch {
      setCustomResult({
        roots: [],
        type: 'invalid',
        steps: [...steps, 'Error: Could not parse equation. Please make sure the syntax is correct (e.g. x^2 - 5x + 6 = 0).']
      });
      return;
    }

    // 4. Try to analyze if it is linear/quadratic by evaluating f(x) at points
    const y0 = f(0);
    const y1 = f(1);
    const yn1 = f(-1);
    
    const a = (y1 + yn1 - 2 * y0) / 2;
    const b = (y1 - yn1) / 2;
    const c = y0;

    const y2 = f(2);
    const expectedY2 = 4 * a + 2 * b + c;
    const yn2 = f(-2);
    const expectedYn2 = 4 * a - 2 * b + c;

    const isPoly = Math.abs(y2 - expectedY2) < 1e-7 && Math.abs(yn2 - expectedYn2) < 1e-7 && 
                   !isNaN(y0) && !isNaN(y1) && !isNaN(yn1) && !isNaN(y2) && !isNaN(yn2);

    if (isPoly) {
      steps.push(`Rearrange equation to standard form: f(x) = LHS - RHS = 0`);
      
      if (Math.abs(a) < 1e-9) {
        // Linear equation: bx + c = 0
        steps.push(`Simplified linear form: Bx + C = 0`);
        steps.push(`Coefficients: B = ${Number(b.toFixed(6))}, C = ${Number(c.toFixed(6))}`);
        
        if (Math.abs(b) < 1e-9) {
          if (Math.abs(c) < 1e-9) {
            steps.push(`Since 0 = 0 is always true, there are infinite solutions.`);
            setCustomResult({ roots: ['Infinite solutions'], type: 'linear', steps });
          } else {
            steps.push(`Since ${Number(c.toFixed(6))} = 0 is false, there is no solution.`);
            setCustomResult({ roots: ['No solution'], type: 'linear', steps });
          }
        } else {
          const root = -c / b;
          steps.push(`Subtract C from both sides: Bx = -C`);
          steps.push(`Divide by B: x = -C / B = -(${Number(c.toFixed(6))}) / ${Number(b.toFixed(6))}`);
          steps.push(`x = ${Number(root.toFixed(6))}`);
          
          setCustomResult({ roots: [Number(root.toFixed(6))], type: 'linear', steps });
          confetti({ particleCount: 30, spread: 40, colors: ['#00f2fe', '#9d4edd'] });
        }
      } else {
        // Quadratic equation: ax^2 + bx + c = 0
        steps.push(`Simplified quadratic form: Ax² + Bx + C = 0`);
        steps.push(`Coefficients: A = ${Number(a.toFixed(6))}, B = ${Number(b.toFixed(6))}, C = ${Number(c.toFixed(6))}`);
        
        const disc = b * b - 4 * a * c;
        steps.push(`Calculate discriminant D = B² - 4AC:`);
        steps.push(`D = (${Number(b.toFixed(6))})² - 4 * (${Number(a.toFixed(6))}) * (${Number(c.toFixed(6))}) = ${Number(disc.toFixed(6))}`);
        
        if (disc > 0) {
          const sqrtD = Math.sqrt(disc);
          steps.push(`Since D > 0, there are two distinct real roots.`);
          steps.push(`x = (-B ± √D) / 2A`);
          const x1 = (-b + sqrtD) / (2 * a);
          const x2 = (-b - sqrtD) / (2 * a);
          steps.push(`x₁ = (${Number(-b.toFixed(6))} + ${Number(sqrtD.toFixed(6))}) / ${Number((2*a).toFixed(6))} = ${Number(x1.toFixed(6))}`);
          steps.push(`x₂ = (${Number(-b.toFixed(6))} - ${Number(sqrtD.toFixed(6))}) / ${Number((2*a).toFixed(6))} = ${Number(x2.toFixed(6))}`);
          
          setCustomResult({ roots: [Number(x1.toFixed(6)), Number(x2.toFixed(6))], type: 'quadratic', steps });
          confetti({ particleCount: 30, spread: 40, colors: ['#00f2fe', '#9d4edd'] });
        } else if (Math.abs(disc) < 1e-9) {
          steps.push(`Since D = 0, there is one double real root.`);
          steps.push(`x = -B / 2A`);
          const root = -b / (2 * a);
          steps.push(`x = ${Number(root.toFixed(6))}`);
          
          setCustomResult({ roots: [Number(root.toFixed(6))], type: 'quadratic', steps });
          confetti({ particleCount: 30, spread: 40, colors: ['#00f2fe', '#9d4edd'] });
        } else {
          steps.push(`Since D < 0, there are two complex roots.`);
          steps.push(`x = (-B ± i√|D|) / 2A`);
          const realPart = -b / (2 * a);
          const imagPart = Math.sqrt(Math.abs(disc)) / (2 * a);
          const rStr = Number(realPart.toFixed(6)).toString();
          const iStr = Number(imagPart.toFixed(6)).toString();
          const x1 = `${rStr} + ${iStr}i`;
          const x2 = `${rStr} - ${iStr}i`;
          steps.push(`x₁ = ${x1}`);
          steps.push(`x₂ = ${x2}`);
          
          setCustomResult({ roots: [x1, x2], type: 'quadratic', steps });
          confetti({ particleCount: 30, spread: 40, colors: ['#00f2fe', '#9d4edd'] });
        }
      }
    } else {
      // General equation: solve numerically in range [-100, 100]
      steps.push(`The equation is non-linear or of higher degree. Solving numerically in range [-100, 100]...`);
      
      const numericalRoots: number[] = [];
      const searchMin = -100;
      const searchMax = 100;
      const searchSteps = 1000;
      const searchStepSize = (searchMax - searchMin) / searchSteps;

      const bisection = (leftVal: number, rightVal: number): number | null => {
        let left = leftVal;
        let right = rightVal;
        
        let fL = f(left);
        const fR = f(right);
        
        if (Math.abs(fL) < 1e-8) return left;
        if (Math.abs(fR) < 1e-8) return right;
        
        for (let iter = 0; iter < 100; iter++) {
          const mid = (left + right) / 2;
          const fM = f(mid);
          
          if (Math.abs(fM) < 1e-10) return mid;
          if (fL * fM < 0) {
            right = mid;
            // fR = fM;
          } else {
            left = mid;
            fL = fM;
          }
        }
        return (left + right) / 2;
      };

      for (let i = 0; i < searchSteps; i++) {
        const x1 = searchMin + i * searchStepSize;
        const x2 = x1 + searchStepSize;
        
        const y1 = f(x1);
        const y2 = f(x2);
        
        if (isNaN(y1) || isNaN(y2) || !isFinite(y1) || !isFinite(y2)) continue;
        
        if (y1 * y2 <= 0) {
          const root = bisection(x1, x2);
          if (root !== null && isFinite(root) && !isNaN(root)) {
            if (Math.abs(f(root)) < 1e-5) {
              if (!numericalRoots.some(r => Math.abs(r - root) < 1e-4)) {
                numericalRoots.push(Number(root.toFixed(6)));
              }
            }
          }
        }
      }

      if (numericalRoots.length > 0) {
        steps.push(`Found ${numericalRoots.length} approximate root(s) in range [-100, 100].`);
        setCustomResult({ roots: numericalRoots, type: 'general', steps });
        confetti({ particleCount: 30, spread: 40, colors: ['#00f2fe', '#9d4edd'] });
      } else {
        const startPoints = [-10, -5, -1, 0, 1, 5, 10];
        const newtonRoots: number[] = [];
        
        startPoints.forEach(start => {
          let x = start;
          for (let iter = 0; iter < 50; iter++) {
            const fx = f(x);
            if (Math.abs(fx) < 1e-8) {
              if (isFinite(x) && !isNaN(x) && !newtonRoots.some(r => Math.abs(r - x) < 1e-4)) {
                newtonRoots.push(Number(x.toFixed(6)));
              }
              break;
            }
            const h = 1e-5;
            const df = (f(x + h) - fx) / h;
            if (Math.abs(df) < 1e-12) break;
            x = x - fx / df;
          }
        });
        
        if (newtonRoots.length > 0) {
          steps.push(`Found ${newtonRoots.length} approximate root(s) via numerical refinement.`);
          setCustomResult({ roots: newtonRoots, type: 'general', steps });
          confetti({ particleCount: 30, spread: 40, colors: ['#00f2fe', '#9d4edd'] });
        } else {
          steps.push(`No real roots found in range [-100, 100].`);
          setCustomResult({ roots: ['No real solutions found in [-100, 100]'], type: 'general', steps });
        }
      }
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
    let xStep: number;
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
    let yStep: number;
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
        let y: number;

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
        } catch {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

            {/* Angle Mode Toggle (DEG/RAD) */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  background: angleMode === 'deg' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${angleMode === 'deg' ? 'var(--primary)' : 'var(--border-glass)'}`,
                  color: angleMode === 'deg' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setAngleMode('deg')}
              >
                DEG (Degrees)
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  background: angleMode === 'rad' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${angleMode === 'rad' ? 'var(--primary)' : 'var(--border-glass)'}`,
                  color: angleMode === 'rad' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setAngleMode('rad')}
              >
                RAD (Radians)
              </button>
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
              {([
                { id: 'length', label: 'Length' },
                { id: 'mass', label: 'Mass / Weight' },
                { id: 'temp', label: 'Temperature' }
              ] as const).map((cat) => (
                <button
                  key={cat.id}
                  style={{
                    ...styles.unitCatBtn,
                    ...(unitCategory === cat.id ? styles.activeUnitCatBtn : {})
                  }}
                  onClick={() => handleUnitCategoryChange(cat.id)}
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
              {([
                { id: 'custom', label: 'Custom Equation' },
                { id: 'linear', label: 'Linear' },
                { id: 'quadratic', label: 'Quadratic' },
                { id: 'system', label: 'System (2 Variables)' }
              ] as const).map((mode) => (
                <button
                  key={mode.id}
                  style={{
                    ...styles.solverModeBtn,
                    ...(solverMode === mode.id ? styles.activeSolverModeBtn : {})
                  }}
                  onClick={() => setSolverMode(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Solver Inputs based on Mode */}
            {solverMode === 'custom' && (
              <div style={styles.solverInputsContainer}>
                <div style={styles.equationDisplay}>
                  <span>Enter your equation (e.g. <code>x^2 - 5x + 6 = 0</code>):</span>
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    value={customEq}
                    onChange={(e) => setCustomEq(e.target.value)}
                    className="form-input"
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '1.1rem',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--border-glass)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      width: '100%',
                    }}
                    placeholder="e.g. x^2 - 5x + 6 = 0"
                  />
                  <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Supports custom equations with variable <code>x</code>. You can use <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, <code>^</code>, and functions like <code>sin(x)</code>, <code>cos(x)</code>, <code>tan(x)</code>, <code>ln(x)</code>, <code>sqrt(x)</code>.
                  </div>
                </div>

                <button className="btn btn-primary" onClick={solveCustomEquation} style={styles.solveBtn}>
                  Solve Equation
                </button>

                {customResult && (
                  <div style={styles.resultContainer}>
                    <h4 style={styles.resultTitle}>Solution:</h4>
                    {customResult.type === 'invalid' ? (
                      <div style={{ ...styles.resultBox, borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
                        <span style={{ color: '#fca5a5', fontWeight: 600 }}>{customResult.steps[customResult.steps.length - 1] || 'Invalid equation'}</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {customResult.roots.map((root, idx) => (
                          <div key={idx} style={styles.resultBox}>
                            <span style={styles.resultLabelText}>
                              {customResult.roots.length > 1
                                ? (customResult.type === 'quadratic'
                                  ? (idx === 0 ? 'x₁ = ' : 'x₂ = ')
                                  : `x${idx + 1} = `)
                                : 'x = '}
                            </span>
                            <span style={styles.resultValueText}>{root}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <h4 style={styles.stepsTitle}>Solving Steps:</h4>
                    <div style={styles.stepsBox}>
                      {customResult.steps.map((step, idx) => (
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
              {([
                { id: 'equation', label: 'Plot Equation' },
                { id: 'data', label: 'Plot Coordinate Data' }
              ] as const).map((mode) => (
                <button
                  key={mode.id}
                  style={{
                    ...styles.plotterModeBtn,
                    ...(plotterMode === mode.id ? styles.activePlotterModeBtn : {})
                  }}
                  onClick={() => setPlotterMode(mode.id)}
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
                            if (window.showToast) window.showToast('Limit must be a valid number.');
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
                            if (window.showToast) window.showToast('Limit must be a valid number.');
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
                            if (window.showToast) window.showToast('Limit must be a valid number.');
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
                            if (window.showToast) window.showToast('Limit must be a valid number.');
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

