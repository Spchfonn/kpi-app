type MyAppColor = "green" | "red" | "orange" | "yellow" | "pink" | "blueDark";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "outline";
    primaryColor?: MyAppColor;
  };
  
  const primaryBgClass: Record<MyAppColor, string> = {
    green: "bg-myApp-green border-myApp-green hover:bg-myApp-green/80",
    red: "bg-myApp-red border-myApp-red hover:bg-myApp-red/80",
    orange: "bg-myApp-orange border-myApp-orange hover:bg-myApp-orange/80",
    yellow: "bg-myApp-yellow border-myApp-yellow hover:bg-myApp-yellow/80",
    pink: "bg-myApp-pink border-myApp-pink hover:bg-myApp-pink/80",
    blueDark: "bg-myApp-blueDark border-myApp-blueDark hover:bg-myApp-blueDark/80",
  };

  const primaryBorderClass: Record<MyAppColor, string> = {
    green: "border-myApp-green text-myApp-green hover:bg-myApp-green/80",
    red: "border-myApp-red text-myApp-red hover:bg-myApp-red/80",
    orange: "border-myApp-orange text-myApp-orange hover:bg-myApp-orange/80",
    yellow: "border-myApp-yellow text-myApp-yellow hover:bg-myApp-yellow/80",
    pink: "border-myApp-pink text-myApp-pink hover:bg-myApp-pink/80",
    blueDark: "border-myApp-blueDark text-myApp-blueDark hover:bg-myApp-blueDark/80",
  };

  export default function Button({ variant = "outline", primaryColor = "green", className = "", ...props }: ButtonProps) {
    const base =
      "px-4 py-1.5 text-button font-medium rounded-4xl transition-colors";
  
    const variants = {
      primary: `${primaryBgClass[primaryColor]} border-2 text-button font-semiBold text-myApp-cream`,
      outline: `${primaryBorderClass[primaryColor]} border-2 text-button font-semiBold hover:text-myApp-cream`,
    };
  
    return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
  }