p="d:/VSCode/hrdb-lenard/components/PhilHealthReportsPage.tsx"
s=open(p).read()
start=s.find("{paymentReport && paymentForm")
end=s.find("{deleteReportTarget &&")
part1=open("d:/VSCode/hrdb-lenard/dialog_part1.txt").read()
part2=open("d:/VSCode/hrdb-lenard/dialog_part2.txt").read()
new_block=part1+part2
s=s[:start]+new_block+s[end:]
open(p,"w").write(s)
print("done")
