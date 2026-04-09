import os
import re

files_to_fix = [
  'src/app/blog/[slug]/post-client.tsx',
  'src/app/precos/page.tsx',
  'src/app/solucoes/content-as-a-service/caas-client.tsx',
  'src/app/solucoes/software-as-a-service/saas-client.tsx',
  'src/app/para/rh/rh-client.tsx',
  'src/app/para/vendas/vendas-client.tsx',
  'src/app/para/marketing/marketing-client.tsx',
  'src/components/sections/use-case-page.tsx',
]

for file in files_to_fix:
  if not os.path.exists(file):
    continue
  with open(file, 'r', encoding='utf-8') as f:
    content = f.read()
  
  # 1. replace <Link href="/contato"> with <button onClick={openPopup}>
  # Note: The button needs a className if it was missing or if it was wrapped in a <Button asChild>.
  # Wait, if it is <Button asChild><Link href="/contato">, we just want to remove the <Link> and add onClick={openPopup} to <Button>
  # And remove asChild!
  
  # Let's just do a regex replace for:
  # <Button asChild(.*?)>
  #   <Link href="/contato">(.*?)</Link>
  # </Button>
  # To:
  # <Button\1 onClick={openPopup}>
  #   \2
  # </Button>
  # But sometimes it's <Button variant="outline" asChild> etc.
  
  # Actually, since it's just 8 files, let's inject useDemoPopup
  if 'useDemoPopup' not in content:
      content = content.replace("import { Button } from '@/components/ui/button';", "import { Button } from '@/components/ui/button';\nimport { useDemoPopup } from '@/components/forms/demo-popup';")
  
  # Inject openPopup hook properly inside component.
  # We look for "const t = useT();" and inject below it, OR "export default function " and inject.
  if 'const { openPopup } = useDemoPopup();' not in content:
      content = content.replace("const t = useT();", "const t = useT();\n  const { openPopup } = useDemoPopup();")
      content = content.replace("const c = t", "const c = t\n  const { openPopup } = useDemoPopup();")
  
  # specific links fixes:
  content = re.sub(r'<Button([^>]*)asChild([^>]*)>\s*<Link href="/[a-z\-]+">(.*?)</Link>\s*</Button>', r'<Button\1\2 onClick={openPopup}>\n              \3\n            </Button>', content, flags=re.DOTALL)
  content = re.sub(r'<Button([^>]*)asChild([^>]*)>\s*<Link href="/[a-z\-]+">(.*?)</Link>', r'<Button\1\2 onClick={openPopup}>\3', content)

  # replace href="/servico" entirely if it was a standalone `<Link href="/servico">` without Button
  content = re.sub(r'<Link href="/servico">(.*?)</Link>', r'<span className="text-primary font-medium cursor-pointer" onClick={openPopup}>\1</span>', content)

  # replace any remaining <Link href="/contato">
  content = re.sub(r'<Link href="/contato"(.*?)>(.*?)</Link>', r'<button type="button" onClick={openPopup} \1>\2</button>', content)

  with open(file, 'w', encoding='utf-8') as f:
    f.write(content)
