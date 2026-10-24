p="d:/VSCode/hrdb-lenard/components/PhilHealthReportsPage.tsx"
s=open(p,encoding="utf-8").read()
start=s.find("{paymentReport && paymentForm")
end=s.find("{deleteReportTarget &&")
part1=open("d:/VSCode/hrdb-lenard/dialog_part1.txt",encoding="utf-8").read()
part2=open("d:/VSCode/hrdb-lenard/dialog_part2.txt",encoding="utf-8").read()
new_block=part1+part2
s=s[:start]+new_block+s[end:]
open(p,"w",encoding="utf-8").write(s)
print("done")
