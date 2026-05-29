here is the code design of the sign-up page. your goal is to redesign the sign-up and sign-in page according to this code to match extract design.

here is the code -- 


<!DOCTYPE html><html class="light" lang="en"><head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<title>Memora - Sign In</title>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com" rel="preconnect">
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Playfair+Display:ital,wght@1,700&amp;display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                            "tertiary-container": "#a44100",
                            "surface-variant": "#e3e2df",
                            "primary-container": "#4f46e5",
                            "inverse-on-surface": "#f2f1ee",
                            "on-secondary": "#ffffff",
                            "error": "#ba1a1a",
                            "on-tertiary-container": "#ffd2be",
                            "secondary-fixed": "#dee2ef",
                            "secondary": "#5a5e69",
                            "text-secondary": "#737373",
                            "surface": "#FFFFFF",
                            "primary-fixed": "#e2dfff",
                            "text-primary": "#111111",
                            "on-primary-fixed": "#0f0069",
                            "surface-container-high": "#e9e8e5",
                            "surface-tint": "#4d44e3",
                            "surface-subtle": "#FAFAFA",
                            "surface-container-lowest": "#ffffff",
                            "tertiary-fixed": "#ffdbcc",
                            "on-primary-container": "#dad7ff",
                            "surface-container-highest": "#e3e2df",
                            "on-tertiary-fixed-variant": "#7b2f00",
                            "success": "#22C55E",
                            "cat-health": "#F97316",
                            "on-secondary-fixed": "#171c25",
                            "secondary-container": "#dee2ef",
                            "text-muted": "#A3A3A3",
                            "inverse-primary": "#c3c0ff",
                            "tertiary-fixed-dim": "#ffb695",
                            "surface-dim": "#dbdad7",
                            "on-primary": "#ffffff",
                            "on-tertiary-fixed": "#351000",
                            "surface-container": "#efeeeb",
                            "cat-insurance": "#3B82F6",
                            "primary-fixed-dim": "#c3c0ff",
                            "outline-variant": "#c7c4d8",
                            "on-surface": "#1b1c1a",
                            "border": "#ECECEC",
                            "surface-bright": "#faf9f6",
                            "outline": "#777587",
                            "on-background": "#1b1c1a",
                            "error-container": "#ffdad6",
                            "on-tertiary": "#ffffff",
                            "cat-passport": "#4F46E5",
                            "tertiary": "#7e3000",
                            "warning": "#F59E0B",
                            "on-surface-variant": "#464555",
                            "on-primary-fixed-variant": "#3323cc",
                            "primary": "#3525cd",
                            "inverse-surface": "#2f312f",
                            "secondary-fixed-dim": "#c2c6d3",
                            "cat-finance": "#10B981",
                            "on-secondary-container": "#60646f",
                            "on-error": "#ffffff",
                            "on-error-container": "#93000a",
                            "background": "#faf9f6",
                            "surface-container-low": "#f4f3f0",
                            "danger": "#EF4444",
                            "cat-certificate": "#8B5CF6",
                            "on-secondary-fixed-variant": "#424751"
                    },
                    "borderRadius": {
                            "DEFAULT": "0.25rem",
                            "lg": "0.5rem",
                            "xl": "0.75rem",
                            "full": "9999px"
                    },
                    "spacing": {
                            "space-3": "12px",
                            "space-10": "64px",
                            "space-8": "40px",
                            "screen-margin": "24px",
                            "card-padding": "20px",
                            "space-5": "20px",
                            "space-4": "16px",
                            "space-2": "8px",
                            "space-6": "24px",
                            "space-7": "32px",
                            "space-9": "48px",
                            "space-1": "4px"
                    },
                    "fontFamily": {
                            "small": [
                                    "Inter"
                            ],
                            "hero": [
                                    "Inter"
                            ],
                            "body": [
                                    "Inter"
                            ],
                            "hero-mobile": [
                                    "Inter"
                            ],
                            "caption": [
                                    "Inter"
                            ],
                            "title": [
                                    "Inter"
                            ],
                            "heading": [
                                    "Inter"
                            ],
                            "brand": [
                                    "Playfair Display"
                            ]
                    },
                    "fontSize": {
                            "small": [
                                    "14px",
                                    {
                                            "lineHeight": "1.4",
                                            "fontWeight": "400"
                                    }
                            ],
                            "hero": [
                                    "40px",
                                    {
                                            "lineHeight": "1.1",
                                            "letterSpacing": "-0.03em",
                                            "fontWeight": "700"
                                    }
                            ],
                            "body": [
                                    "16px",
                                    {
                                            "lineHeight": "1.5",
                                            "fontWeight": "400"
                                    }
                            ],
                            "hero-mobile": [
                                    "32px",
                                    {
                                            "lineHeight": "1.2",
                                            "letterSpacing": "-0.02em",
                                            "fontWeight": "700"
                                    }
                            ],
                            "caption": [
                                    "12px",
                                    {
                                            "lineHeight": "1.2",
                                            "fontWeight": "500"
                                    }
                            ],
                            "title": [
                                    "22px",
                                    {
                                            "lineHeight": "1.3",
                                            "fontWeight": "600"
                                    }
                            ],
                            "heading": [
                                    "28px",
                                    {
                                            "lineHeight": "1.2",
                                            "fontWeight": "700"
                                    }
                            ],
                            "brand-logo": [
                                    "48px",
                                    {
                                            "lineHeight": "1.1",
                                            "fontWeight": "700",
                                            "letterSpacing": "-0.02em"
                                    }
                            ]
                    }
            },
                },
        }
    </script>
<style>
        .material-symbols-outlined {
          font-variation-settings:
          'FILL' 0,
          'wght' 400,
          'GRAD' 0,
          'opsz' 24
        }
        
        .shadow-soft {
            box-shadow: 0 8px 24px rgba(79, 70, 229, 0.25);
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
</head>
<body class="bg-surface text-text-primary font-body antialiased min-h-screen flex flex-col items-center justify-center p-screen-margin">
<main class="w-full max-w-md mx-auto flex flex-col space-y-space-9">
<!-- Header Section -->
<div class="text-center space-y-space-2"><div class="flex justify-center mb-space-4">
<img alt="Memora Mascot" class="w-[120px] h-auto" src="https://lh3.googleusercontent.com/aida/ADBb0ujrIU8rDp0WGGSLSQqsnP3Rhho05IcW8ATSB6S_wWBJL7XQMT_N9w7rYVzws8wUXiN6OR06-34q-F8rxmy4J8vHbatiOY37D14f6ayNTS-mvDd4SPZk3r2BiAxZPXpE0K2YPhdfuQuWDkDNfloJU4pfCUZ-QqTGQHsrP0bwpQ3qO8J_82IFLo7gIBrGwEYpiPCc7mDP6rQ1WhKEI9tGxxxJaDOlFdkrUlNE8gjjw368oHYPNAa4ruTsQhM">
</div>
<h1 class="font-brand text-brand-logo italic text-text-primary">Memora</h1>
<p class="font-body text-body text-text-secondary">Welcome Back</p>
</div>
<!-- Form Section -->
<form action="#" class="space-y-space-6" method="POST">
<!-- Email Field -->
<div class="space-y-space-2">
<label class="block font-caption text-caption text-text-secondary uppercase tracking-wider" for="email">Email</label>
<div class="relative">
<input class="w-full bg-surface-subtle border border-border rounded-lg px-4 py-3 font-body text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 placeholder-text-muted" id="email" name="email" placeholder="hello@example.com" required="" type="email">
</div>
</div>
<!-- Password Field -->
<div class="space-y-space-2">
<div class="flex items-center justify-between">
<label class="block font-caption text-caption text-text-secondary uppercase tracking-wider" for="password">Password</label>
<a class="font-caption text-caption text-primary hover:text-primary-container transition-colors duration-200 uppercase tracking-wider" href="#">Forgot?</a>
</div>
<div class="relative">
<input class="w-full bg-surface-subtle border border-border rounded-lg px-4 py-3 font-body text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 tracking-widest placeholder-text-muted text-2xl" id="password" name="password" placeholder="••••••••" required="" type="password">
</div>
</div>
<!-- Log In Button -->
<div class="pt-space-2">
<button class="w-full h-[52px] bg-primary hover:opacity-90 text-on-primary font-title text-body font-semibold rounded-2xl shadow-soft transition-all duration-200 active:scale-[0.98]" type="submit">
                    Log In
                </button>
</div>
</form>
<!-- Divider -->
<div class="relative flex items-center py-space-2">
<div class="flex-grow border-t border-border"></div>
<span class="flex-shrink-0 mx-4 font-caption text-caption text-text-secondary uppercase tracking-wider">Or</span>
<div class="flex-grow border-t border-border"></div>
</div>
<!-- Google Sign In -->
<div>
<button class="w-full h-[52px] bg-surface border border-border hover:bg-surface-subtle text-text-primary font-body text-body rounded-2xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center space-x-3" type="button">
<svg fill="none" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
<path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.8 15.72 17.58V20.34H19.29C21.37 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"></path>
<path d="M12 23C14.97 23 17.46 22.02 19.29 20.34L15.72 17.58C14.73 18.25 13.48 18.66 12 18.66C9.13 18.66 6.7 16.73 5.82 14.12H2.15V16.96C3.96 20.57 7.68 23 12 23Z" fill="#34A853"></path>
<path d="M5.82 14.12C5.59 13.45 5.46 12.74 5.46 12C5.46 11.26 5.59 10.55 5.82 9.88V7.04H2.15C1.41 8.52 1 10.21 1 12C1 13.79 1.41 15.48 2.15 16.96L5.82 14.12Z" fill="#FBBC05"></path>
<path d="M12 5.34C13.62 5.34 15.06 5.89 16.2 6.98L19.36 3.82C17.46 2.05 14.97 1 12 1C7.68 1 3.96 3.43 2.15 7.04L5.82 9.88C6.7 7.27 9.13 5.34 12 5.34Z" fill="#EA4335"></path>
</svg>
<span>Sign in with Google</span>
</button>
</div>
<!-- Footer Link -->
<div class="text-center pt-space-4">
<p class="font-body text-body text-text-secondary">
                Don't have an account? <a class="text-primary hover:text-primary-container transition-colors duration-200 font-medium" href="#">Sign Up</a>
</p>
</div>
</main>
</body></html>