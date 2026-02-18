-- Add country column to properties table
ALTER TABLE public.properties 
ADD COLUMN country text NOT NULL DEFAULT 'kosovo' 
CHECK (country IN ('kosovo', 'albania'));

-- Update existing properties based on common cities
UPDATE public.properties SET country = 'albania' 
WHERE lower(city) IN ('tiranë', 'tirana', 'durrës', 'durres', 'vlorë', 'vlore', 'shkodër', 'shkoder', 'fier', 'korçë', 'korce', 'elbasan', 'berat', 'lushnjë', 'lushnje', 'kavajë', 'kavaje', 'sarandë', 'sarande', 'gjirokastër', 'gjirokaster', 'pogradec', 'lezhë', 'lezhe');
