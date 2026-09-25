import os
import re

def process_classes(class_string):
    # We only want to replace standalone classes
    classes = class_string.split()
    
    # If this element has a brand/colored background, it probably needs to stay white
    has_colored_bg = any(c.startswith('bg-organic') or c.startswith('bg-blue') or c.startswith('bg-green') or c.startswith('bg-red') or c.startswith('bg-amber') or c.startswith('bg-gradient') or c.startswith('from-') or c.startswith('to-') for c in classes)
    
    new_classes = []
    
    for c in classes:
        # Don't replace if it's dynamic interpolation like ${...} or contains ternary operators
        if '{' in c or '}' in c or '?' in c or ':' in c and not c.startswith('dark:') and not c.startswith('hover:') and not c.startswith('focus:'):
            new_classes.append(c)
            continue
            
        clean_c = c.split(':')[-1] # Base class name
        
        # Avoid replacing if dark: already applied to this property
        if c == 'text-white' and 'dark:text-white' not in classes and not has_colored_bg:
            new_classes.extend(['text-slate-900', 'dark:text-white'])
        elif c == 'bg-white/5' and 'dark:bg-white/5' not in classes:
            new_classes.extend(['bg-white', 'dark:bg-white/5', 'shadow-sm', 'dark:shadow-none'])
        elif c == 'bg-white/10' and 'dark:bg-white/10' not in classes:
            new_classes.extend(['bg-slate-100', 'dark:bg-white/10', 'shadow-sm', 'dark:shadow-none'])
        elif c == 'bg-gray-900' and 'dark:bg-gray-900' not in classes:
            new_classes.extend(['bg-white', 'dark:bg-gray-900', 'shadow-md', 'dark:shadow-none'])
        elif c == 'bg-slate-950' and 'dark:bg-slate-950' not in classes:
            new_classes.extend(['bg-slate-50', 'dark:bg-slate-950'])
        elif c == 'bg-slate-900' and 'dark:bg-slate-900' not in classes:
            new_classes.extend(['bg-white', 'dark:bg-slate-900'])
        elif c == 'text-gray-400' and 'dark:text-gray-400' not in classes:
            new_classes.extend(['text-slate-600', 'dark:text-gray-400'])
        elif c == 'text-gray-500' and 'dark:text-gray-500' not in classes:
            new_classes.extend(['text-slate-500', 'dark:text-gray-500'])
        elif c == 'text-gray-300' and 'dark:text-gray-300' not in classes:
            new_classes.extend(['text-slate-700', 'dark:text-gray-300'])
        elif c == 'text-slate-300' and 'dark:text-slate-300' not in classes:
            new_classes.extend(['text-slate-700', 'dark:text-slate-300'])
        elif c == 'text-slate-400' and 'dark:text-slate-400' not in classes:
            new_classes.extend(['text-slate-600', 'dark:text-slate-400'])
        elif c == 'text-white/80' and 'dark:text-white/80' not in classes:
            new_classes.extend(['text-slate-700', 'dark:text-white/80'])
        elif c == 'border-white/10' and 'dark:border-white/10' not in classes:
            new_classes.extend(['border-slate-200', 'dark:border-white/10'])
        elif c == 'border-white/5' and 'dark:border-white/5' not in classes:
            new_classes.extend(['border-slate-200', 'dark:border-white/5'])
        else:
            new_classes.append(c)
            
    # Removing exact duplicates while keeping order
    seen = set()
    result = []
    for c in new_classes:
        if c not in seen:
            seen.add(c)
            result.append(c)
            
    return " ".join(result)

def modify_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        return

    # Replace standard classNames className="something"
    def replacer(match):
        prefix = match.group(1)
        classes = match.group(2)
        suffix = match.group(3)
        return prefix + process_classes(classes) + suffix

    # Note: re.sub is safe for non-capturing overlapping groups when structured strictly
    content = re.sub(r'(className=")([^"]+)(")', replacer, content)
    
    # We also have className={`...`} but template literals can have expressions like ${...}
    # It's better to just regex replace individual classes word-by-word inside backticks, but the replacer processes the whole string.
    # We can split the backtick string into parts by ${...} manually or just rely on the fallback.
    content = re.sub(r'(className=`)([^`]+)(`)', replacer, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def walk_dir():
    src_dir = r"d:\DEGREE\ACADEMIC\HACKTHON\Let_Go_3.0\frontend\src"
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.jsx') or file.endswith('.tsx'):
                modify_file(os.path.join(root, file))

if __name__ == "__main__":
    walk_dir()
    print("Done applying dark/light theme fallbacks")
