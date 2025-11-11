#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to split the large index.html into separate pages
"""

import re
import os

def read_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(filename, content):
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

def extract_section(content, start_marker, end_marker):
    """Extract content between two markers"""
    start_idx = content.find(start_marker)
    if start_idx == -1:
        return None
    start_idx += len(start_marker)
    end_idx = content.find(end_marker, start_idx)
    if end_idx == -1:
        return content[start_idx:].strip()
    return content[start_idx:end_idx].strip()

def create_page_template(title, page_title, nav_links, content_section):
    """Create HTML page template"""
    return f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{title}">
    <title>{page_title}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- 固定导航栏 -->
    <div class="fixed-nav" id="fixedNav">
        <div class="nav-content">
            <div class="logo"><a href="index.html" style="text-decoration: none; color: inherit;">个性化芳疗方案</a></div>
            <button class="menu-toggle" id="menuToggle">☰</button>
            <nav id="navMenu">
{nav_links}
            </nav>
        </div>
    </div>

    <!-- 返回顶部按钮 -->
    <button class="back-to-top" id="backToTop">↑</button>

    <div class="container">
{content_section}
    </div>

    <script src="common.js"></script>
</body>
</html>'''

def main():
    content = read_file('index.html')
    
    # Navigation links
    nav_links = '''                <a href="index.html">首页</a>
                <a href="health-profile.html">健康状况</a>
                <a href="essential-oils.html">精油介绍</a>
                <a href="safety.html">安全须知</a>
                <a href="formula-builder.html">配方实验</a>
                <a href="formulas.html">定制配方</a>
                <a href="schedule.html">使用时间</a>
                <a href="making.html">制作指南</a>'''
    
    # Extract sections
    sections = {
        'health-profile': {
            'start': '<!-- 第一部分:健康状况分析 -->',
            'end': '<!-- 第二部分:精油库介绍 -->',
            'title': '健康状况分析',
            'filename': 'health-profile.html'
        },
        'essential-oils': {
            'start': '<!-- 第二部分:精油库介绍 -->',
            'end': '<!-- 第三部分:安全使用须知 -->',
            'title': '精油库介绍',
            'filename': 'essential-oils.html'
        },
        'safety': {
            'start': '<!-- 第三部分:安全使用须知 -->',
            'end': '<!-- 第四部分:配方实验器 -->',
            'title': '安全使用须知',
            'filename': 'safety.html'
        },
        'formula-builder': {
            'start': '<!-- 第四部分:配方实验器 -->',
            'end': '<!-- 第五部分:定制配方方案 -->',
            'title': '配方实验器',
            'filename': 'formula-builder.html',
            'needs_formula_js': True
        },
        'formulas': {
            'start': '<!-- 第五部分:定制配方方案 -->',
            'end': '<!-- 第六部分:每日使用时间表 -->',
            'title': '定制配方方案',
            'filename': 'formulas.html'
        },
        'schedule': {
            'start': '<!-- 第六部分:每日使用时间表 -->',
            'end': '<!-- 第七部分:配方制作指南 -->',
            'title': '每日使用时间表',
            'filename': 'schedule.html'
        },
        'making': {
            'start': '<!-- 第七部分:配方制作指南 -->',
            'end': '<script>',
            'title': '配方制作指南',
            'filename': 'making.html'
        }
    }
    
    # Create individual pages
    for key, section_info in sections.items():
        section_content = extract_section(content, section_info['start'], section_info['end'])
        if section_content:
            # Add h1 title
            page_content = f'        <h1>{section_info["title"]}</h1>\n        <p class="subtitle">个性化芳疗方案使用指南 · 2025年11月</p>\n\n        {section_content}'
            
            # Add footer
            page_content += '''
        <div class="footer">
            <p>
                本指南专为您的健康状况定制<br>
                建议连续使用6-8周后评估效果<br>
                如有任何不适,请立即停用并咨询专业人士<br><br>
                <strong>制定日期:2025年11月</strong>
            </p>
        </div>'''
            
            # Create page
            page_html = create_page_template(
                section_info['title'],
                f'{section_info["title"]} - 个性化芳疗方案',
                nav_links,
                page_content
            )
            
            # Add formula-builder.js if needed
            if section_info.get('needs_formula_js'):
                page_html = page_html.replace('<script src="common.js"></script>', 
                    '<script src="common.js"></script>\n    <script src="formula-builder.js"></script>')
            
            write_file(section_info['filename'], page_html)
            print(f'Created {section_info["filename"]}')
    
    # Create index.html (landing page)
    index_content = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="个性化芳疗方案使用指南 - 定制化精油配方与安全使用手册">
    <title>个性化芳疗方案使用指南</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        .hero {
            text-align: center;
            padding: 80px 20px;
        }
        .hero h1 {
            font-size: 48px;
            margin-bottom: 20px;
        }
        .hero p {
            font-size: 18px;
            color: var(--secondary-color);
            margin-bottom: 40px;
        }
        .card-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 30px;
            margin: 40px 0;
        }
        .feature-card {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: var(--shadow);
            transition: var(--transition);
            text-decoration: none;
            color: inherit;
            display: block;
        }
        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-hover);
        }
        .feature-card h3 {
            margin-top: 0;
            color: var(--primary-color);
        }
        .feature-card p {
            color: var(--secondary-color);
            margin-bottom: 0;
        }
    </style>
</head>
<body>
    <div class="fixed-nav" id="fixedNav">
        <div class="nav-content">
            <div class="logo">个性化芳疗方案</div>
            <button class="menu-toggle" id="menuToggle">☰</button>
            <nav id="navMenu">
                <a href="index.html">首页</a>
                <a href="health-profile.html">健康状况</a>
                <a href="essential-oils.html">精油介绍</a>
                <a href="safety.html">安全须知</a>
                <a href="formula-builder.html">配方实验</a>
                <a href="formulas.html">定制配方</a>
                <a href="schedule.html">使用时间</a>
                <a href="making.html">制作指南</a>
            </nav>
        </div>
    </div>

    <button class="back-to-top" id="backToTop">↑</button>

    <div class="container">
        <div class="hero">
            <h1>个性化芳疗方案使用指南</h1>
            <p>定制化精油配方 · 安全使用手册 · 2025年11月</p>
        </div>

        <div class="card-grid">
            <a href="health-profile.html" class="feature-card">
                <h3>一、健康状况分析</h3>
                <p>了解您的健康状况和调理方向</p>
            </a>
            <a href="essential-oils.html" class="feature-card">
                <h3>二、精油库介绍</h3>
                <p>17种精油的详细资料和功效说明</p>
            </a>
            <a href="safety.html" class="feature-card">
                <h3>三、安全使用须知</h3>
                <p>重要的安全警示和使用注意事项</p>
            </a>
            <a href="formula-builder.html" class="feature-card">
                <h3>四、配方实验器</h3>
                <p>创建和实验您自己的精油配方</p>
            </a>
            <a href="formulas.html" class="feature-card">
                <h3>五、定制配方方案</h3>
                <p>专业的配方方案和使用指导</p>
            </a>
            <a href="schedule.html" class="feature-card">
                <h3>六、每日使用时间表</h3>
                <p>详细的使用时间安排和作息建议</p>
            </a>
            <a href="making.html" class="feature-card">
                <h3>七、配方制作指南</h3>
                <p>制作步骤、工具和保存方法</p>
            </a>
        </div>
    </div>

    <script src="common.js"></script>
</body>
</html>'''
    
    write_file('index_new.html', index_content)
    print('Created index_new.html (rename to index.html after backup)')
    
    print('\nDone! Remember to:')
    print('1. Backup original index.html')
    print('2. Rename index_new.html to index.html')
    print('3. Create common.js and formula-builder.js files')

if __name__ == '__main__':
    main()

